// 云函数：chapter
// 功能：章节的增删改查
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 有效的章节ID列表
const VALID_CHAPTER_IDS = [
  'background', 'childhood', 'education', 'career',
  'love', 'family', 'travel', 'relationships', 'laterlife', 'wisdom'
]

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, error: '用户未登录' }
  }

  const { action } = event

  switch (action) {
    case 'save':
      return saveChapter(event, openid)
    case 'getList':
      return getChapterList(openid)
    case 'getOne':
      return getChapter(event, openid)
    case 'delete':
      return deleteChapter(event, openid)
    default:
      return { success: false, error: '未知操作: ' + action }
  }
}

// 保存（新建或更新）章节
async function saveChapter(event, openid) {
  const { chapterId, title, content, recordings, backgroundImage } = event

  if (!chapterId) {
    return { success: false, error: '章节ID不能为空' }
  }

  const isCustomDiary = chapterId.startsWith('diary_')
  if (!VALID_CHAPTER_IDS.includes(chapterId) && !isCustomDiary) {
    return { success: false, error: '无效的章节ID: ' + chapterId }
  }

  try {
    // 查询是否已有该章节
    const existing = await db.collection('chapters').where({
      openid,
      chapter_id: chapterId
    }).get()

    const wordCount = (content || '').replace(/\s/g, '').length
    const recordingCount = (recordings || []).length
    const status = wordCount > 0 || recordingCount > 0 ? 'in_progress' : 'draft'

    let chapter
    if (existing.data.length === 0) {
      // 新建
      const addRes = await db.collection('chapters').add({
        data: {
          openid,
          chapter_id: chapterId,
          title: title || '未命名章节',
          content: content || '',
          recordings: recordings || [],
          background_image: backgroundImage || null,
          status,
          word_count: wordCount,
          recording_count: recordingCount,
          created_at: db.serverDate(),
          updated_at: db.serverDate()
        }
      })
      chapter = {
        _id: addRes._id,
        chapterId,
        title: title || '未命名章节',
        content: content || '',
        recordings: recordings || [],
        status,
        wordCount,
        recordingCount
      }
    } else {
      // 更新
      const doc = existing.data[0]
      await db.collection('chapters').doc(doc._id).update({
        data: {
          title: title || doc.title,
          content: content !== undefined ? content : doc.content,
          recordings: recordings || doc.recordings,
          ...(backgroundImage !== undefined ? { background_image: backgroundImage } : {}),
          status,
          word_count: wordCount,
          recording_count: recordingCount,
          updated_at: db.serverDate()
        }
      })
      chapter = {
        _id: doc._id,
        chapterId,
        title: title || doc.title,
        content: content !== undefined ? content : doc.content,
        recordings: recordings || doc.recordings,
        status,
        wordCount,
        recordingCount
      }
    }

    return { success: true, message: '章节保存成功', data: { chapter } }
  } catch (err) {
    console.error('保存章节失败:', err)
    return { success: false, error: err.message }
  }
}

// 获取用户所有章节
async function getChapterList(openid) {
  try {
    const res = await db.collection('chapters')
      .where({ openid })
      .orderBy('updated_at', 'desc')
      .limit(50)
      .get()

    const chapters = res.data.map(c => ({
      _id: c._id,
      chapterId: c.chapter_id,
      title: c.title,
      content: c.content,
      recordings: c.recordings || [],
      backgroundImage: c.background_image,
      status: c.status,
      wordCount: c.word_count || 0,
      recordingCount: c.recording_count || 0,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }))

    return {
      success: true,
      data: { chapters, total: chapters.length }
    }
  } catch (err) {
    console.error('获取章节列表失败:', err)
    return { success: false, error: err.message }
  }
}

// 获取单个章节
async function getChapter(event, openid) {
  const { chapterId } = event

  if (!chapterId) {
    return { success: false, error: '章节ID不能为空' }
  }

  try {
    const res = await db.collection('chapters').where({
      openid,
      chapter_id: chapterId
    }).get()

    if (res.data.length === 0) {
      return { success: false, error: '章节不存在' }
    }

    const c = res.data[0]
    return {
      success: true,
      data: {
        chapter: {
          _id: c._id,
          chapterId: c.chapter_id,
          title: c.title,
          content: c.content,
          recordings: c.recordings || [],
          backgroundImage: c.background_image,
          status: c.status,
          wordCount: c.word_count || 0,
          recordingCount: c.recording_count || 0,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }
      }
    }
  } catch (err) {
    console.error('获取章节失败:', err)
    return { success: false, error: err.message }
  }
}

// 删除章节
async function deleteChapter(event, openid) {
  const { chapterId } = event

  if (!chapterId) {
    return { success: false, error: '章节ID不能为空' }
  }

  try {
    const res = await db.collection('chapters').where({
      openid,
      chapter_id: chapterId
    }).get()

    if (res.data.length === 0) {
      return { success: false, error: '章节不存在' }
    }

    await db.collection('chapters').doc(res.data[0]._id).remove()
    return { success: true, message: '章节删除成功' }
  } catch (err) {
    console.error('删除章节失败:', err)
    return { success: false, error: err.message }
  }
}
