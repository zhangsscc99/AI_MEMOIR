// 云函数：speech
// 功能：获取语音识别Token（阿里云/百度），上传音频到云存储后调用识别
// 环境变量需在微信云开发控制台配置：
//   ALIYUN_AK_ID       - 阿里云AccessKey ID
//   ALIYUN_AK_SECRET   - 阿里云AccessKey Secret
//   ALIYUN_APP_KEY     - 阿里云语音AppKey
//   BAIDU_APP_ID       - 百度语音App ID
//   BAIDU_API_KEY      - 百度语音API Key
//   BAIDU_SECRET_KEY   - 百度语音Secret Key
const cloud = require('wx-server-sdk')
const axios = require('axios')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { action } = event

  switch (action) {
    case 'getBaiduToken':
      return getBaiduToken()
    case 'transcribeBaidu':
      return transcribeBaidu(event)
    case 'getAliyunToken':
      return getAliyunToken()
    default:
      return { success: false, error: '未知操作: ' + action }
  }
}

// 获取百度语音识别Token
async function getBaiduToken() {
  const apiKey = process.env.BAIDU_API_KEY
  const secretKey = process.env.BAIDU_SECRET_KEY

  if (!apiKey || !secretKey) {
    return { success: false, error: '百度语音配置未设置' }
  }

  try {
    const res = await axios.post(
      'https://openapi.baidu.com/oauth/2.0/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: secretKey
        },
        timeout: 10000
      }
    )

    if (res.data.access_token) {
      return {
        success: true,
        data: {
          token: res.data.access_token,
          expiresIn: res.data.expires_in
        }
      }
    } else {
      return { success: false, error: '获取Token失败: ' + JSON.stringify(res.data) }
    }
  } catch (err) {
    console.error('获取百度Token失败:', err)
    return { success: false, error: err.message }
  }
}

// 百度语音转文字（传入音频base64）
async function transcribeBaidu(event) {
  const { audioBase64, format = 'pcm', rate = 16000 } = event
  const appId = process.env.BAIDU_APP_ID
  const apiKey = process.env.BAIDU_API_KEY
  const secretKey = process.env.BAIDU_SECRET_KEY

  if (!audioBase64) {
    return { success: false, error: '未提供音频数据' }
  }

  if (!appId || !apiKey || !secretKey) {
    return { success: false, error: '百度语音配置未设置' }
  }

  try {
    // 先获取Token
    const tokenRes = await getBaiduToken()
    if (!tokenRes.success) return tokenRes

    const token = tokenRes.data.token
    const audioBuffer = Buffer.from(audioBase64, 'base64')

    const res = await axios.post(
      'https://vop.baidu.com/server_api',
      {
        format,
        rate,
        channel: 1,
        cuid: 'ai_memoir_miniprogram',
        token,
        speech: audioBase64,
        len: audioBuffer.length,
        dev_pid: 1537 // 普通话（有标点）
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    )

    if (res.data.err_no === 0) {
      return {
        success: true,
        data: { text: res.data.result[0] }
      }
    } else {
      return {
        success: false,
        error: `识别失败，错误码: ${res.data.err_no}, ${res.data.err_msg}`
      }
    }
  } catch (err) {
    console.error('百度语音识别失败:', err)
    return { success: false, error: err.message }
  }
}

// 获取阿里云NLS Token
async function getAliyunToken() {
  const akId = process.env.ALIYUN_AK_ID
  const akSecret = process.env.ALIYUN_AK_SECRET

  if (!akId || !akSecret) {
    return { success: false, error: '阿里云语音配置未设置' }
  }

  try {
    // 构建阿里云API签名
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

    // 生成签名
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
