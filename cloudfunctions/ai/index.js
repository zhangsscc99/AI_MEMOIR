// 云函数：ai
// 只负责数据操作：读写回忆录内容、对话历史
// AI 调用已移至小程序端（wx.serviceMarket.invokeService）
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 获取用户回忆录内容
async function getUserMemoirContent(openid) {
  try {
    const [chaptersRes, diariesRes] = await Promise.all([
      db.collection('chapters').where({ openid }).orderBy('updated_at', 'desc').limit(20).get(),
      db.collection('diaries').where({ _openid: openid }).orderBy('updated_at', 'desc').limit(10).get()
    ])

    const chapters = chaptersRes.data.map(c => ({
      title: c.title || '未命名',
      content: c.content || '',
      type: '章节',
      updatedAt: c.updated_at || c.created_at
    })).filter(m => m.content.trim().length > 0)

    const diaries = diariesRes.data.map(d => ({
      title: d.title || '随记',
      content: d.content || '',
      type: '随记',
      updatedAt: d.updated_at || d.diary_date || d.created_at
    })).filter(m => m.content.trim().length > 0)

    const toTs = (v) => {
      if (!v) return 0
      if (v instanceof Date) return v.getTime()
      if (typeof v === 'string' || typeof v === 'number') { const t = new Date(v).getTime(); return isNaN(t) ? 0 : t }
      if (v && typeof v.getTime === 'function') { const t = v.getTime(); return isNaN(t) ? 0 : t }
      return 0
    }

    return [...chapters, ...diaries].sort((a, b) => toTs(b.updatedAt) - toTs(a.updatedAt))
  } catch (err) {
    console.error('获取回忆录内容失败:', err)
    return []
  }
}

// 构建 AI 角色系统提示词
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
  const otherSummary = others.length > 0
    ? `\n\n其他记忆片段：${others.map(m => m.title).join('、')}等${others.length}个片段`
    : ''

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

// 保存对话历史
async function saveConversation(openid, history) {
  try {
    const existing = await db.collection('ai_conversations').where({ openid }).get()
    const data = { openid, history: history.slice(-20), updated_at: db.serverDate() }
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
    case 'getContext':       return getContext(event, openid)
    case 'getGuestPrompt':  return { success: true, data: { systemPrompt: GUEST_PROMPT } }
    case 'saveHistory':     return saveHistory(event, openid)
    case 'getMemoirSummary': return getMemoirSummary(openid)
    case 'getHistory':      return getHistory(openid)
    case 'clearHistory':    return clearHistory(openid)
    default:
      return { success: false, error: '未知操作: ' + action }
  }
}

// 获取对话上下文（systemPrompt + 历史消息）
async function getContext(event, openid) {
  if (!openid) return { success: false, error: '用户未登录' }
  const { characterName } = event
  try {
    const [memories, history] = await Promise.all([
      getUserMemoirContent(openid),
      getConversationHistory(openid)
    ])
    const systemPrompt = buildCharacterPrompt(memories, characterName)
    return { success: true, data: { systemPrompt, history, memoryCount: memories.length } }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 保存对话历史
async function saveHistory(event, openid) {
  if (!openid) return { success: false, error: '用户未登录' }
  const { history } = event
  if (!Array.isArray(history)) return { success: false, error: 'history 格式错误' }
  try {
    await saveConversation(openid, history)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 获取回忆录摘要（供小程序端调用 MiniMax 提取角色名和简介）
async function getMemoirSummary(openid) {
  if (!openid) return { success: false, error: '用户未登录' }
  try {
    const memories = await getUserMemoirContent(openid)
    if (memories.length === 0) {
      return { success: true, data: { hasMemoir: false, summary: '' } }
    }
    const summary = memories.slice(0, 5)
      .map(m => `【${m.type}】${m.title}：${m.content.substring(0, 200)}`)
      .join('\n\n')
      .substring(0, 1200)
    return { success: true, data: { hasMemoir: true, summary } }
  } catch (err) {
    return { success: false, error: err.message }
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
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
