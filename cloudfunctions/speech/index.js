// 云函数：speech
// 功能：获取阿里云智能语音交互 Token
// 环境变量需在微信云开发控制台配置：
//   ALIYUN_AK_ID       - 阿里云 AccessKey ID
//   ALIYUN_AK_SECRET   - 阿里云 AccessKey Secret
//   ALIYUN_APP_KEY     - 阿里云语音 AppKey
const cloud = require('wx-server-sdk')
const axios = require('axios')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'getAliyunToken':
      return getAliyunToken()
    default:
      return { success: false, error: '未知操作: ' + action + '（语音识别仅支持阿里云）' }
  }
}

// 获取阿里云 NLS Token
async function getAliyunToken() {
  const akId = process.env.ALIYUN_AK_ID
  const akSecret = process.env.ALIYUN_AK_SECRET

  if (!akId || !akSecret) {
    return { success: false, error: '阿里云语音配置未设置' }
  }

  try {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const nonce = Math.random().toString(36).substr(2)

    const params = {
      Action: 'CreateToken',
      Version: '2019-02-28',
      Format: 'JSON',
      AccessKeyId: akId,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: timestamp,
      SignatureVersion: '1.0',
      SignatureNonce: nonce
    }

    const sortedKeys = Object.keys(params).sort()
    const canonicalStr = sortedKeys.map(k =>
      encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
    ).join('&')

    const stringToSign = 'GET&' + encodeURIComponent('/') + '&' + encodeURIComponent(canonicalStr)
    const signature = crypto.createHmac('sha1', akSecret + '&').update(stringToSign).digest('base64')

    const queryString = canonicalStr + '&Signature=' + encodeURIComponent(signature)
    const url = `https://nls-meta.cn-shanghai.aliyuncs.com/?${queryString}`

    const res = await axios.get(url, { timeout: 10000 })

    if (res.data.Token) {
      return {
        success: true,
        data: {
          token: res.data.Token.Id,
          expireTime: res.data.Token.ExpireTime,
          appKey: process.env.ALIYUN_APP_KEY
        }
      }
    } else {
      return { success: false, error: '获取阿里云Token失败: ' + JSON.stringify(res.data) }
    }
  } catch (err) {
    console.error('获取阿里云Token失败:', err)
    return { success: false, error: err.message }
  }
}
