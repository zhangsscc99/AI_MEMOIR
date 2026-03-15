// 云函数：ai
// 功能：AI对话、文本润色、图片分析
// 使用 MiniMax（微信服务市场）
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const MINIMAX_SERVICE_ID = 'wx1ef79fe5f143a445'
const MINIMAX_API_NAME   = 'ChatCompletionPro'
const MINIMAX_MODEL      = 'abab5.5-chat'
const BOT_NAME           = 'MM智能助理'

// 把 OpenAI 格式 messages 转成 MiniMax 格式
// system → bot_setting，user/assistant → messages 数组
function convertToMiniMax(messages) {
  let systemPrompt = '你是一个有用的AI助手。'
  const converted = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = typeof msg.content === 'string' ? msg.content : systemPrompt
    } else if (msg.role === 'user') {
      const text = typeof msg.content === 'string'
        ? msg.content
        : (Array.isArray(msg.content) ? (msg.content.find(c => c.type === 'text') || {}).text || '' : '')
      converted.push({ sender_type: 'USER', sender_name: '用户', text })
    } else if (msg.role === 'assistant') {
      converted.push({ sender_type: 'BOT', sender_name: BOT_NAME, text: msg.content || '' })
    }
  }

  return { systemPrompt, converted }
}

// 调用 MiniMax（微信服务市场 invokeService）
async function callMiniMax(messages, maxTokens = 1500) {
  const { systemPrompt, converted } = convertToMiniMax(messages)

  if (converted.length === 0) throw new Error('消息列表为空')

  const requestData = {
    model: MINIMAX_MODEL,
    tokens_to_generate: maxTokens,
    temperature: 0.9,
    top_p: 0.95,
    stream: false,
    reply_constraints: { sender_type: 'BOT', sender_name: BOT_NAME },
    messages: converted,
    bot_setting: [{ bot_name: BOT_NAME, content: systemPrompt }]
  }

  const result = await cloud.openapi.servicemarket.invokeService({
    service: MINIMAX_SERVICE_ID,
    api: MINIMAX_API_NAME,
    data: requestData,
    clientmsgid: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  })

  const resp = result.data || result
  if (resp.base_resp && resp.base_resp.status_code !== 0) {
    throw new Error(`MiniMax错误(${resp.base_resp.status_code}): ${resp.base_resp.status_msg}`)
  }

  return resp.reply || (resp.choices && resp.choices[0] && resp.choices[0].messages && resp.choices[0].messages[0] && resp.choices[0].messages[0].text) || ''
}

// 获取用户回忆录内容（章节 + 随记）
async function getUserMemoirContent(openid) {
  try {
    const [chaptersRes, diariesRes] = await Promise.all([
      db.collection('chapters')
        .where({ openid })
        .orderBy('updated_at', 'desc')
        .limit(20)
        .get(),
      db.collection('diaries')
        .where({ _openid: openid })
        .orderBy('updated_at', 'desc')
        .limit(10)
        .get()
    ])

    const chapters = chaptersRes.data.map(c => ({
      chapterId: c.chapter_id,
      title: c.title || '未命名',
      content: c.content || '',
      type: '章节',
      createdAt: c.created_at,
      updatedAt: c.updated_at || c.created_at
    })).filter(m => m.content.trim().length > 0)

    const diaries = diariesRes.data.map(d => ({
      chapterId: d._id,
      title: d.title || '随记',
      content: d.content || '',
      type: '随记',
      createdAt: d.created_at || d.diary_date,
      updatedAt: d.updated_at || d.diary_date || d.created_at
    })).filter(m => m.content.trim().length > 0)

    const toTs = (value) => {
      if (!value) return 0
      if (value instanceof Date) return value.getTime()
      if (typeof value === 'string' || typeof value === 'number') {
        const t = new Date(value).getTime()
        return Number.isNaN(t) ? 0 : t
      }
      if (value && typeof value === 'object' && typeof value.getTime === 'function') {
        const t = value.getTime()
        return Number.isNaN(t) ? 0 : t
      }
      return 0
    }

    return [...chapters, ...diaries].sort((a, b) => {
      return toTs(b.updatedAt || b.createdAt) - toTs(a.updatedAt || a.createdAt)
    })
  } catch (err) {
    console.error('获取回忆录内容失败:', err)
    return []
  }
}

// 构建AI角色系统提示词
function buildCharacterPrompt(memories, characterName = '用户') {
  if (memories.length === 0) {
    return `你是${characterName}，一个基于用户回忆录生成的AI角色。虽然用户还没有记录回忆录内容，但你很乐意与用户聊天，了解他们的故事。把与你对话的用户当成一个陌生人，与他们进行友好的交流。`
  }

  const recentMemories = memories.slice(0, 5)
  const recentContent = recentMemories.map(item => {
    const content = item.content.length > 300 ? item.content.substring(0, 300) + '...' : item.content
    return `【${item.type}】${item.title}\n内容：${content}`
  }).join('\n\n')

  const otherMemories = memories.slice(5)
  const otherSummary = otherMemories.length > 0
    ? `\n\n其他记忆片段：${otherMemories.map(m => m.title).join('、')}等${otherMemories.length}个片段`
    : ''

  return `你是${characterName}，一个基于用户回忆录内容生成的AI角色。你拥有回忆录中记录的所有记忆和经历。

你的回忆录内容：
${recentContent}${otherSummary}

请基于以上回忆录内容与用户对话：
1. 以第一人称的方式，展现与回忆录内容相符的性格和经历
2. 把与你对话的用户当成一个陌生人，不要认为他们就是回忆录的作者
3. 引用具体的回忆录内容来回答问题，让用户感受到你的真实记忆
4. 如果用户询问回忆录中的具体事件，请详细描述相关细节
5. 保持与回忆录中经历的一致性，不要编造不存在的内容
6. 展现温暖、理解、有记忆的AI角色特质
7. 如果用户询问回忆录中没有的内容，请诚实地说"我不太记得这件事，能告诉我更多吗？"`
}

// 保存对话历史到云数据库
async function saveConversation(openid, history) {
  try {
    const existing = await db.collection('ai_conversations').where({ openid }).get()
    const data = {
      openid,
      history: history.slice(-20),
      updated_at: db.serverDate()
    }
    if (existing.data.length === 0) {
      await db.collection('ai_conversations').add({ data: { ...data, created_at: db.serverDate() } })
    } else {
      await db.collection('ai_conversations').doc(existing.data[0]._id).update({ data })
    }
  } catch (err) {
    console.error('保存对话历史失败:', err)
  }
}

// 获取对话历史
async function getConversationHistory(openid) {
  try {
    const res = await db.collection('ai_conversations').where({ openid }).get()
    if (res.data.length === 0) return []
    return res.data[0].history || []
  } catch (err) {
    return []
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event

  switch (action) {
    case 'chat':
      return chatWithAI(event, openid)
    case 'guestChat':
      return guestChatWithAI(event)
    case 'completeText':
      return completeText(event)
    case 'analyzeImage':
      return analyzeImage(event, openid)
    case 'getHistory':
      return getHistory(openid)
    case 'clearHistory':
      return clearHistory(openid)
    case 'getCharacterName':
      return getCharacterName(openid)
    case 'getCharacterInfo':
      return getCharacterInfo(openid)
    default:
      return { success: false, error: '未知操作: ' + action }
  }
}

// 已登录用户AI聊天（带回忆录上下文）
async function chatWithAI(event, openid) {
  const { message, characterName = '用户' } = event

  if (!message || !message.trim()) return { success: false, error: '消息内容不能为空' }
  if (!openid) return { success: false, error: '用户未登录' }

  try {
    const memories = await getUserMemoirContent(openid)
    const systemPrompt = buildCharacterPrompt(memories, characterName)
    const history = await getConversationHistory(openid)
    const newHistory = [...history, { role: 'user', content: message }]
    const messages = [{ role: 'system', content: systemPrompt }, ...newHistory]

    const aiResponse = await callMiniMax(messages, 1500)

    const updatedHistory = [...newHistory, { role: 'assistant', content: aiResponse }]
    await saveConversation(openid, updatedHistory)

    return { success: true, data: { response: aiResponse, memoryCount: memories.length } }
  } catch (err) {
    console.error('AI聊天失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

// 游客AI聊天
async function guestChatWithAI(event) {
  const { message } = event

  if (!message || !message.trim()) return { success: false, error: '消息内容不能为空' }

  try {
    const messages = [
      {
        role: 'system',
        content: `你是小忆，一个专业的AI回忆录助手。你的任务是：
1. 友好介绍回忆录记录的重要性和价值
2. 介绍我们的回忆录功能，包括语音录制、文字记录、AI补全等
3. 鼓励用户注册账号体验完整的个性化AI聊天功能
4. 回答用户关于回忆录、人生记录等问题
5. 保持自然、友好的对话，不要过于商业化

请用温暖、专业的语调与用户交流。`
      },
      { role: 'user', content: message }
    ]

    const aiResponse = await callMiniMax(messages, 800)
    return { success: true, data: { response: aiResponse } }
  } catch (err) {
    console.error('游客AI聊天失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

// AI文本润色
async function completeText(event) {
  const { text, chapterTitle } = event

  if (!text || !text.trim()) return { success: false, error: '文本内容不能为空' }

  try {
    const messages = [
      {
        role: 'system',
        content: `你是一名严谨的文本润色助手。当前用户的内容来自语音识别，可能包含错字、乱码或不通顺的句子。请按照以下要求处理：
1. 忠实原文：避免加入新的事实或情节，不要编造信息。
2. 纠正错误：修复错别字、乱码、重复词、以及明显不合语法或语义的句子。
3. 保持语气：在保持原有表达风格和情感的前提下，让句子通顺自然。
4. 标点与分段：补全缺失的标点，适度断句；仅在必要时微调段落结构。
5. 长度接近：最终文本长度应与原文相近，禁止大幅扩写或删减。

输出经过校正后的完整文本，不要添加任何解释、点评或额外标记。`
      },
      {
        role: 'user',
        content: `请按照系统指引，对以下回忆录内容做轻量润色：

章节：${chapterTitle || '回忆录'}
内容：${text}

重点修正识别错误，让语句自然通顺，并保持原始含义。`
      }
    ]

    const completedText = await callMiniMax(messages, 2000)
    return { success: true, data: { originalText: text, completedText } }
  } catch (err) {
    console.error('文本润色失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

// AI图片分析（生成回忆录文字，基于文字描述上下文）
async function analyzeImage(event, openid) {
  const { chapterTitle } = event

  try {
    const memories = openid ? await getUserMemoirContent(openid) : []
    const summaryText = memories.length > 0
      ? memories.slice(0, 3).map((m, i) => `${i + 1}.《${m.title}》：${m.content.substring(0, 100)}`).join('\n')
      : '暂无回忆录内容'

    const messages = [
      {
        role: 'system',
        content: `你是一位中文回忆录写作助手。请根据用户提供的章节背景，用第一人称写出一段温暖真实的回忆文字。写作要求：
1. 用温暖、真诚的口吻，语句连贯，长度控制在2~4句（约80~140字）；
2. 基于章节主题展开情感描写；
3. 禁止生硬列举或重复原文。`
      },
      {
        role: 'user',
        content: `以下是该用户回忆录的章节摘要（仅作辅助）：\n${summaryText}\n\n当前章节：${chapterTitle || '回忆录'}\n\n请写出一段与该章节相关的回忆文字。最终输出只需包含生成的段落，不要额外说明。`
      }
    ]

    const aiResponse = await callMiniMax(messages, 500)
    return { success: true, data: { text: aiResponse.trim() } }
  } catch (err) {
    console.error('图片分析失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

// 获取对话历史
async function getHistory(openid) {
  if (!openid) return { success: false, error: '用户未登录' }
  const history = await getConversationHistory(openid)
  return { success: true, data: { history } }
}

// 清空对话历史
async function clearHistory(openid) {
  if (!openid) return { success: false, error: '用户未登录' }
  try {
    const res = await db.collection('ai_conversations').where({ openid }).get()
    if (res.data.length > 0) {
      await db.collection('ai_conversations').doc(res.data[0]._id).update({
        data: { history: [], updated_at: db.serverDate() }
      })
    }
    return { success: true, message: '对话历史已清空' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 从回忆录内容中提取人物姓名
async function getCharacterName(openid) {
  if (!openid) return { success: false, error: '用户未登录' }

  const memories = await getUserMemoirContent(openid)
  if (memories.length === 0) return { success: true, data: { name: null } }

  try {
    const sampleContent = memories.slice(0, 3).map(m => m.content).join('\n\n').substring(0, 600)

    const messages = [
      {
        role: 'system',
        content: '从以下回忆录内容中识别主人公的姓名或称谓（例如"张秀英"、"爷爷"、"外婆"等）。只输出名字本身，不超过8个字，不要加任何解释。如果无法确定，输出"小忆"。'
      },
      { role: 'user', content: sampleContent }
    ]

    const name = await callMiniMax(messages, 30)
    const trimmed = name.trim().replace(/["""''《》【】]/g, '')
    return { success: true, data: { name: trimmed || null } }
  } catch (err) {
    return { success: true, data: { name: null } }
  }
}

function buildFallbackCharacterDesc(memories, name = '小忆') {
  if (!memories || memories.length === 0) {
    return '我是小忆，你的AI回忆录助手。还没有回忆录内容，快去记录你的故事吧！'
  }
  const latest = memories[0]
  const clean = (latest.content || '').replace(/\s+/g, '').slice(0, 24)
  const title = latest.title || '最近的记忆'
  if (clean) {
    return `我是${name}，最近又想起《${title}》：${clean}${clean.length >= 24 ? '…' : ''}`
  }
  return `我是${name}，我的故事都写在回忆录里，欢迎和我聊聊。`
}

// 提取角色名 + 生成角色简介
async function getCharacterInfo(openid) {
  if (!openid) return { success: false, error: '用户未登录' }

  const memories = await getUserMemoirContent(openid)
  if (memories.length === 0) {
    return { success: true, data: { name: '小忆', desc: buildFallbackCharacterDesc(memories, '小忆') } }
  }

  try {
    const sampleContent = memories
      .slice(0, 5)
      .map(m => `【${m.type}】${m.title}：${m.content.substring(0, 200)}`)
      .join('\n\n')
      .substring(0, 1200)

    const messages = [
      {
        role: 'system',
        content: `根据以下回忆录内容，请用JSON格式输出两个字段：
1. "name"：主人公的姓名或称谓（如"张秀英"、"爷爷"、"外婆"），不超过8个字，无法确定时用"小忆"
2. "desc"：以第一人称写一段自我介绍，基于回忆录的真实内容，体现主人公的经历和性格，50字以内，不要套话

只输出JSON，不要其他内容。示例：{"name":"张秀英","desc":"我是张秀英，生于1950年代的农村，经历了许多岁月变迁，最爱和家人一起过节。"}`
      },
      { role: 'user', content: sampleContent }
    ]

    const raw = await callMiniMax(messages, 200)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const name = (parsed.name || '小忆').trim().replace(/["""''《》【】]/g, '')
      const desc = (parsed.desc || '').trim() || buildFallbackCharacterDesc(memories, name || '小忆')
      return { success: true, data: { name, desc } }
    }
    return { success: true, data: { name: '小忆', desc: buildFallbackCharacterDesc(memories, '小忆') } }
  } catch (err) {
    return { success: true, data: { name: '小忆', desc: buildFallbackCharacterDesc(memories, '小忆') } }
  }
}
