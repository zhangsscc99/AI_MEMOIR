// 云函数：login
// 功能：微信登录、创建/更新用户信息
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, error: '获取openid失败' }
  }

  try {
    // 查询用户是否存在
    const res = await db.collection('users').where({ openid }).get()

    let user
    if (res.data.length === 0) {
      // 新用户：创建记录
      const addRes = await db.collection('users').add({
        data: {
          openid,
          nickname: event.nickName || '用户',
          avatar: event.avatarUrl || '',
          bio: '',
          created_at: db.serverDate(),
          updated_at: db.serverDate(),
          last_login_at: db.serverDate(),
          login_count: 1
        }
      })
      user = {
        _id: addRes._id,
        openid,
        nickname: event.nickName || '用户',
        avatar: event.avatarUrl || '',
        bio: '',
        isNew: true
      }
    } else {
      // 老用户：更新登录信息
      user = res.data[0]
      await db.collection('users').doc(user._id).update({
        data: {
          last_login_at: db.serverDate(),
          login_count: _.inc(1),
          updated_at: db.serverDate(),
          // 如果传入了新的昵称/头像则更新（微信授权场景）
          ...(event.nickName ? { nickname: event.nickName } : {}),
          ...(event.avatarUrl ? { avatar: event.avatarUrl } : {})
        }
      })
      user.isNew = false
    }

    return {
      success: true,
      user: {
        _id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio || '',
        isNew: user.isNew
      }
    }
  } catch (err) {
    console.error('登录云函数失败:', err)
    return { success: false, error: err.message }
  }
}
