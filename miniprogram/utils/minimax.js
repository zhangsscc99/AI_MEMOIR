// utils/minimax.js
// 封装微信服务市场 MiniMax 调用
const SERVICE_ID = 'wx1ef79fe5f143a445'
const API_NAME   = 'ChatCompletionPro'
const BOT_NAME   = 'MM智能助理'
const MODEL      = 'abab5.5-chat'

/**
 * 调用 MiniMax
 * @param {string} systemPrompt  系统提示词（对应 bot_setting）
 * @param {Array}  messages      OpenAI 格式 [{role:'user'|'assistant', content:'...'}]
 * @param {number} maxTokens     最大生成 token 数，默认 1500
 * @returns {Promise<string>}    AI 回复文本
 */
function callMiniMax(systemPrompt, messages, maxTokens) {
  return new Promise(function(resolve, reject) {
    var converted = messages.map(function(msg) {
      return {
        sender_type: msg.role === 'user' ? 'USER' : 'BOT',
        sender_name: msg.role === 'user' ? '用户' : BOT_NAME,
        text: typeof msg.content === 'string'
          ? msg.content
          : ((msg.content || [])[0] || {}).text || ''
      }
    })

    wx.serviceMarket.invokeService({
      service: SERVICE_ID,
      api: API_NAME,
      data: {
        model: MODEL,
        tokens_to_generate: maxTokens || 1500,
        temperature: 0.9,
        top_p: 0.95,
        stream: false,
        reply_constraints: { sender_type: 'BOT', sender_name: BOT_NAME },
        messages: converted,
        bot_setting: [{ bot_name: BOT_NAME, content: systemPrompt || '你是一个有用的AI助手。' }]
      },
      success: function(res) {
        var data = res.data || res
        if (data.base_resp && data.base_resp.status_code !== 0) {
          reject(new Error('MiniMax错误: ' + data.base_resp.status_msg))
        } else {
          resolve(data.reply || '')
        }
      },
      fail: function(err) {
        reject(new Error(err.errMsg || 'MiniMax调用失败'))
      }
    })
  })
}

module.exports = { callMiniMax: callMiniMax }
