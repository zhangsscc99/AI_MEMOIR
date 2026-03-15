// 云函数：ai
// 功能：AI对话、文本润色
// 通过 cloud.openapi.serviceMarket.invokeService 调用微信服务市场 MiniMax
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const MINIMAX_SERVICE_ID = 'wx1ef79fe5f143a445'
const MINIMAX_API_NAME   = 'ChatCompletionPro'
const BOT_NAME           = 'MM智能助理'
const MODEL              = 'abab5.5-chat'

// 把 OpenAI 格式 messages 转成 MiniMax 格式
function convertToMiniMax(messages) {
  let systemPrompt = '你是一个有用的AI助手。'
  const converted = []
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = typeof msg.content === 'string' ? msg.content : systemPrompt
    } else if (msg.role === 'user') {
      const text = typeof msg.content === 'string' ? msg.content
        : (Array.isArray(msg.content) ? (msg.content.find(c => c.type === 'text') || {}).text || '' : '')
      converted.push({ sender_type: 'USER', sender_name: '用户', text })
    } else if (msg.role === 'assistant') {
      converted.push({ sender_type: 'BOT', sender_name: BOT_NAME, text: msg.content || '' })
    }
  }
  return { systemPrompt, converted }
}

// 调用 MiniMax（微信服务市场，云函数侧）
async function callMiniMax(messages, maxTokens) {
  const { systemPrompt, converted } = convertToMiniMax(messages)
  if (converted.length === 0) throw new Error('消息列表为空')

  const result = await cloud.openapi.serviceMarket.invokeService({
    service: MINIMAX_SERVICE_ID,
    api: MINIMAX_API_NAME,
    data: {
      model: MODEL,
      tokens_to_generate: maxTokens || 1500,
      temperature: 0.9,
      top_p: 0.95,
      stream: false,
      reply_constraints: { sender_type: 'BOT', sender_name: BOT_NAME },
      messages: converted,
      bot_setting: [{ bot_name: BOT_NAME, content: systemPrompt }]
    },
    clientmsgid: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  })

  const resp = result.data || result
  if (resp.base_resp && resp.base_resp.status_code !== 0) {
    throw new Error(`MiniMax错误(${resp.base_resp.status_code}): ${resp.base_resp.status_msg}`)
  }
  return resp.reply || (resp.choices && resp.choices[0] && resp.choices[0].messages && resp.choices[0].messages[0] && resp.choices[0].messages[0].text) || ''
}

// 获取用户回忆录内容
async function getUserMemoirContent(openid) {
  try {
    const [chaptersRes, diariesRes] = await Promise.all([
      db.collection('chapters').where({ openid }).orderBy('updated_at', 'desc').limit(20).get(),
      db.collection('diaries').where({ _openid: openid }).orderBy('updated_at', 'desc').limit(10).get()
    ])
    const toTs = v => {
      if (!v) return 0
      if (v instanceof Date) return v.getTime()
      if (typeof v === 'string' || typeof v === 'number') { const t = new Date(v).getTime(); return isNaN(t) ? 0 : t }
      if (v && typeof v.getTime === 'function') { const t = v.getTime(); return isNaN(t) ? 0 : t }
      return 0
    }
    const chapters = chaptersRes.data.map(c => ({ title: c.title || '未命名', content: c.content || '', type: '章节', updatedAt: c.updated_at || c.created_at })).filter(m => m.content.trim())
    const diaries = diariesRes.data.map(d => ({ title: d.title || '随记', content: d.content || '', type: '随记', updatedAt: d.updated_at || d.diary_date || d.created_at })).filter(m => m.content.trim())
    return [...chapters, ...diaries].sort((a, b) => toTs(b.updatedAt) - toTs(a.updatedAt))
  } catch (err) {
    console.error('获取回忆录内容失败:', err)
    return []
  }
}

function buildCharacterPrompt(memories, characterName) {
  const name = characterName || '用户'
  if (memories.length === 0) {
    return `你是${name}，一个基于用户回忆录生成的AI角色。虽然用户还没有记录回忆录内容，但你很乐意与用户聊天，了解他们的故事。把与你对话的用户当成一个陌生人，与他们进行友好的交流。`
  }
  const recent = memories.slice(0, 5).map(item => {
    const content = item.content.length > 300 ? item.content.substring(0, 300) + '...' : item.content
    return `【${item.type}】${item.title}\n内容：${content}`
  }).join('\n\n')
  const others = memories.slice(5)
  const otherSummary = others.length > 0 ? `\n\n其他记忆片段：${others.map(m => m.title).join('、')}等${others.length}个片段` : ''
  return `你是${name}，一个基于用户回忆录内容生成的AI角色。你拥有回忆录中记录的所有记忆和经历。

你的回忆录内容：
${recent}${otherSummary}

请基于以上回忆录内容与用户对话：
1. 以第一人称的方式，展现与回忆录内容相符的性格和经历
2. 把与你对话的用户当成一个陌生人，不要认为他们就是回忆录的作者
3. 引用具体的回忆录内容来回答问题，让用户感受到你的真实记忆
4. 如果用户询问回忆录中的具体事件，请详细描述相关细节
5. 保持与回忆录中经历的一致性，不要编造不存在的内容
6. 展现温暖、理解、有记忆的AI角色特质
7. 如果用户询问回忆录中没有的内容，请诚实地说"我不太记得这件事，能告诉我更多吗？"`
}

const GUEST_PROMPT = `你是小忆，一个专业的AI回忆录助手。你的任务是：
1. 友好介绍回忆录记录的重要性和价值
2. 介绍我们的回忆录功能，包括语音录制、文字记录、AI补全等
3. 鼓励用户注册账号体验完整的个性化AI聊天功能
4. 回答用户关于回忆录、人生记录等问题
5. 保持自然、友好的对话，不要过于商业化
请用温暖、专业的语调与用户交流。`

async function saveConversation(openid, history) {
  try {
    const existing = await db.collection('ai_conversations').where({ openid }).get()
    const data = { openid, history: history.slice(-20), updated_at: db.serverDate() }
    if (existing.data.length === 0) {
      await db.collection('ai_conversations').add({ data: { ...data, created_at: db.serverDate() } })
    } else {
      await db.collection('ai_conversations').doc(existing.data[0]._id).update({ data })
    }
  } catch (err) { console.error('保存对话历史失败:', err) }
}

async function getConversationHistory(openid) {
  try {
    const res = await db.collection('ai_conversations').where({ openid }).get()
    return res.data.length === 0 ? [] : (res.data[0].history || [])
  } catch { return [] }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event

  switch (action) {
    case 'chat':         return chatWithAI(event, openid)
    case 'guestChat':    return guestChatWithAI(event)
    case 'completeText': return completeText(event)
    case 'getHistory':   return getHistory(openid)
    case 'clearHistory': return clearHistory(openid)
    case 'getMemoirSummary': return getMemoirSummary(openid)
    default: return { success: false, error: '未知操作: ' + action }
  }
}

async function chatWithAI(event, openid) {
  const { message, characterName = '用户' } = event
  if (!message || !message.trim()) return { success: false, error: '消息内容不能为空' }
  if (!openid) return { success: false, error: '用户未登录' }
  try {
    const [memories, history] = await Promise.all([getUserMemoirContent(openid), getConversationHistory(openid)])
    const systemPrompt = buildCharacterPrompt(memories, characterName)
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

async function guestChatWithAI(event) {
  const { message } = event
  if (!message || !message.trim()) return { success: false, error: '消息内容不能为空' }
  try {
    const messages = [{ role: 'system', content: GUEST_PROMPT }, { role: 'user', content: message }]
    const aiResponse = await callMiniMax(messages, 800)
    return { success: true, data: { response: aiResponse } }
  } catch (err) {
    console.error('游客AI聊天失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

async function completeText(event) {
  const { text, chapterTitle } = event
  if (!text || !text.trim()) return { success: false, error: '文本内容不能为空' }
  try {
    const systemPrompt = `你是一名严谨的文本润色助手。当前用户的内容来自语音识别，可能包含错字、乱码或不通顺的句子。请按照以下要求处理：
1. 忠实原文：避免加入新的事实或情节，不要编造信息。
2. 纠正错误：修复错别字、乱码、重复词、以及明显不合语法或语义的句子。
3. 保持语气：在保持原有表达风格和情感的前提下，让句子通顺自然。
4. 标点与分段：补全缺失的标点，适度断句；仅在必要时微调段落结构。
5. 长度接近：最终文本长度应与原文相近，禁止大幅扩写或删减。
输出经过校正后的完整文本，不要添加任何解释、点评或额外标记。`
    const userMsg = `章节：${chapterTitle || '回忆录'}\n内容：${text}\n重点修正识别错误，让语句自然通顺，并保持原始含义。`
    const completedText = await callMiniMax([{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }], 2000)
    return { success: true, data: { originalText: text, completedText } }
  } catch (err) {
    console.error('文本润色失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

async function getMemoirSummary(openid) {
  if (!openid) return { success: false, error: '用户未登录' }
  try {
    const memories = await getUserMemoirContent(openid)
    if (memories.length === 0) return { success: true, data: { hasMemoir: false, summary: '' } }
    const summary = memories.slice(0, 5).map(m => `【${m.type}】${m.title}：${m.content.substring(0, 200)}`).join('\n\n').substring(0, 1200)
    return { success: true, data: { hasMemoir: true, summary } }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function getHistory(openid) {
  if (!openid) return { success: false, error: '用户未登录' }
  const history = await getConversationHistory(openid)
  return { success: true, data: { history } }
}

async function clearHistory(openid) {
  if (!openid) return { success: false, error: '用户未登录' }
  try {
    const res = await db.collection('ai_conversations').where({ openid }).get()
    if (res.data.length > 0) {
      await db.collection('ai_conversations').doc(res.data[0]._id).update({ data: { history: [], updated_at: db.serverDate() } })
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
