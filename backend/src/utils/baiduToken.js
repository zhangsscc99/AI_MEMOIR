const https = require('https');

class BaiduTokenService {
  constructor() {
    this.apiKey = process.env.BAIDU_SPEECH_API_KEY;
    this.secretKey = process.env.BAIDU_SPEECH_SECRET_KEY;

    if (!this.apiKey || !this.secretKey) {
      console.warn('⚠️  百度语音识别配置未设置，语音识别功能将不可用');
    }

    this.tokenCache = {
      token: null,
      expireAt: 0
    };
  }

  /**
   * 发起 HTTPS 请求并解析 JSON 响应
   * @param {string} url 请求地址
   * @returns {Promise<object>}
   */
  requestJson(url) {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let rawData = '';

          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            rawData += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(rawData);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`解析百度响应失败: ${error.message}`));
            }
          });
        })
        .on('error', (error) => {
          reject(new Error(`请求百度令牌失败: ${error.message}`));
        });
    });
  }

  /**
   * 获取百度语音识别 Access Token
   * @returns {Promise<{ token: string, expireAt: number, expiresIn: number }>}
   */
  async fetchToken() {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('百度语音识别 API Key 或 Secret Key 未配置');
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.apiKey,
      client_secret: this.secretKey
    });

    const url = `https://aip.baidubce.com/oauth/2.0/token?${params.toString()}`;
    const response = await this.requestJson(url);

    if (!response.access_token) {
      const errorMsg = response.error_description || response.error || '未知错误';
      throw new Error(`获取百度 Access Token 失败: ${errorMsg}`);
    }

    const expiresIn = Number(response.expires_in || 0); // 秒
    const expireAt = Date.now() + expiresIn * 1000;

    return {
      token: response.access_token,
      expireAt,
      expiresIn
    };
  }

  /**
   * 获取缓存中的 token，若无效则重新获取
   * @returns {Promise<string>}
   */
  async getToken() {
    const now = Date.now();
    if (this.tokenCache.token && this.tokenCache.expireAt - 5 * 60 * 1000 > now) {
      return this.tokenCache.token;
    }

    const { token, expireAt } = await this.fetchToken();
    this.tokenCache = {
      token,
      expireAt
    };

    return token;
  }

  /**
   * 清除缓存的 token
   */
  clearTokenCache() {
    this.tokenCache = {
      token: null,
      expireAt: 0
    };
  }

  /**
   * 当前 token 是否仍然有效
   * @returns {boolean}
   */
  isTokenValid() {
    return this.tokenCache.token && this.tokenCache.expireAt > Date.now();
  }
}

module.exports = new BaiduTokenService();
