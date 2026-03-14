// 云函数：ai
// 功能：AI对话、文本润色、图片分析
// 使用通义千问 (DashScope) API
// 环境变量需在微信云开发控制台配置：
//   DASHSCOPE_API_KEY - 通义千问API密钥
//   DASHSCOPE_MODEL   - 模型名称，默认 qwen-plus
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DEFAULT_MODEL = 'qwen-plus'

// 调用DashScope（通义千问）API
async function callDashScope(messages, model, maxTokens = 1500) {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY 未配置，请在微信云开发控制台设置环境变量')
  }

  const response = await axios.post(
    `${DASHSCOPE_BASE_URL}/chat/completions`,
    {
      model: model || process.env.DASHSCOPE_MODEL || DEFAULT_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: false
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  )

  return response.data.choices[0].message.content
}

// 获取用户回忆录内容（从云数据库读取章节）
async function getUserMemoirContent(openid) {
  try {
    const res = await db.collection('chapters')
      .where({ openid })
      .orderBy('updated_at', 'desc')
      .limit(20)
      .get()

    return res.data.map(c => ({
      chapterId: c.chapter_id,
      title: c.title || '未命名',
      content: c.content || '',
      type: (c.chapter_id || '').startsWith('diary_') ? '随记' : '章节',
      createdAt: c.created_at
    })).filter(m => m.content.trim().length > 0)
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
      history: history.slice(-20), // 只保留最近20条
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
    default:
      return { success: false, error: '未知操作: ' + action }
  }
}

// 已登录用户AI聊天（带回忆录上下文）
async function chatWithAI(event, openid) {
  const { message, characterName = '用户' } = event

  if (!message || !message.trim()) {
    return { success: false, error: '消息内容不能为空' }
  }

  if (!openid) {
    return { success: false, error: '用户未登录' }
  }

  try {
    // 获取回忆录内容构建角色
    const memories = await getUserMemoirContent(openid)
    const systemPrompt = buildCharacterPrompt(memories, characterName)

    // 获取历史对话
    const history = await getConversationHistory(openid)

    // 添加用户消息
    const newHistory = [...history, { role: 'user', content: message }]

    // 构建完整消息列表
    const messages = [
      { role: 'system', content: systemPrompt },
      ...newHistory
    ]

    // 调用AI
    const aiResponse = await callDashScope(messages, null, 1500)

    // 保存对话（含AI回复）
    const updatedHistory = [...newHistory, { role: 'assistant', content: aiResponse }]
    await saveConversation(openid, updatedHistory)

    return {
      success: true,
      data: {
        response: aiResponse,
        memoryCount: memories.length
      }
    }
  } catch (err) {
    console.error('AI聊天失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

// 游客AI聊天（介绍功能）
async function guestChatWithAI(event) {
  const { message } = event

  if (!message || !message.trim()) {
    return { success: false, error: '消息内容不能为空' }
  }

  try {
    const systemPrompt = `你是小忆，一个专业的AI回忆录助手。你的任务是：
1. 友好介绍回忆录记录的重要性和价值
2. 介绍我们的回忆录功能，包括语音录制、文字记录、AI补全等
3. 鼓励用户注册账号体验完整的个性化AI聊天功能
4. 回答用户关于回忆录、人生记录等问题
5. 保持自然、友好的对话，不要过于商业化

请用温暖、专业的语调与用户交流。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    const aiResponse = await callDashScope(messages, null, 800)

    return {
      success: true,
      data: { response: aiResponse }
    }
  } catch (err) {
    console.error('游客AI聊天失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

// AI文本润色（语音转文字后使用）
async function completeText(event) {
  const { text, chapterTitle } = event

  if (!text || !text.trim()) {
    return { success: false, error: '文本内容不能为空' }
  }

  try {
    const systemPrompt = `你是一名严谨的文本润色助手。当前用户的内容来自语音识别，可能包含错字、乱码或不通顺的句子。请按照以下要求处理：
1. 忠实原文：避免加入新的事实或情节，不要编造信息。
2. 纠正错误：修复错别字、乱码、重复词、以及明显不合语法或语义的句子。
3. 保持语气：在保持原有表达风格和情感的前提下，让句子通顺自然。
4. 标点与分段：补全缺失的标点，适度断句；仅在必要时微调段落结构。
5. 长度接近：最终文本长度应与原文相近，禁止大幅扩写或删减。

输出经过校正后的完整文本，不要添加任何解释、点评或额外标记。`

    const userPrompt = `请按照系统指引，对以下回忆录内容做轻量润色：

章节：${chapterTitle || '回忆录'}
内容：${text}

重点修正识别错误，让语句自然通顺，并保持原始含义。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const completedText = await callDashScope(messages, null, 2000)

    return {
      success: true,
      data: {
        originalText: text,
        completedText
      }
    }
  } catch (err) {
    console.error('文本润色失败:', err)
    return { success: false, error: 'AI服务暂时不可用: ' + err.message }
  }
}

// AI图片分析（生成回忆录文字）
async function analyzeImage(event, openid) {
  const { imageUrl, chapterId, chapterTitle } = event

  if (!imageUrl) {
    return { success: false, error: '请提供图片地址' }
  }

  try {
    const memories = openid ? await getUserMemoirContent(openid) : []
    const summaryText = memories.length > 0
      ? memories.slice(0, 3).map((m, i) => `${i + 1}.《${m.title}》：${m.content.substring(0, 100)}`).join('\n')
      : '暂无回忆录内容'

    const systemPrompt = `你是一位中文回忆录写作助手。请以图片中的主体为核心进行回忆，用第一人称叙事展开情感。写作要求：
1. 先观察图片，明确最显眼的人物/物品/环境，再围绕这些主体写出情境细节；
2. 续写时保持温暖、真诚的口吻，语句连贯，长度控制在2~4句（约80~140字）；
3. 如果图片与回忆录摘要存在差异，请以图片为准，仍需与角色设定衔接；
4. 禁止生硬列举或重复原文，禁止引入图片和摘要之外的全新人物或道具。`

    const contextText = `以下是该用户回忆录的章节摘要（仅作辅助，参考语气即可）：\n${summaryText}\n\n当前章节：${chapterTitle || '回忆录'}\n\n请重点描写图片中的主体，并写出它引发的回忆或情绪。最终输出只需包含生成的段落，不要额外说明。`

    const model = process.env.DASHSCOPE_VL_MODEL || 'qwen-vl-plus'
    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: contextText },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ]

    const aiResponse = await callDashScope(messages, model, 500)

    return {
      success: true,
      data: { text: aiResponse.trim() }
    }
  } catch (err) {
    console.error('图片分析失败:', err)
    return { success: false, error: 'AI图片分析失败: ' + err.message }
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
