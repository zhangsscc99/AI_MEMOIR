const RPCClient = require('@alicloud/pop-core').RPCClient;

class AliyunTokenService {
  constructor() {
    // 检查是否有阿里云配置
    if (!process.env.ALIYUN_AK_ID || !process.env.ALIYUN_AK_SECRET) {
      console.log('⚠️  阿里云配置未设置，语音识别功能将不可用');
      this.client = null;
      return;
    }
    
    this.client = new RPCClient({
      accessKeyId: process.env.ALIYUN_AK_ID,
      accessKeySecret: process.env.ALIYUN_AK_SECRET,
      endpoint: 'https://nls-meta.cn-shanghai.aliyuncs.com',
      apiVersion: '2019-02-28'
    });
    
    // Token缓存
    this.tokenCache = {
      token: null,
      expireTime: 0
    };
  }

  /**
   * 获取阿里云语音识别Token
   * @returns {Promise<string>} Token字符串
   */
  async getToken() {
    try {
      // 检查客户端是否已初始化
      if (!this.client) {
        throw new Error('阿里云配置未设置，无法获取Token');
      }
      
      // 检查缓存的Token是否还有效（提前5分钟刷新）
      const now = Math.floor(Date.now() / 1000);
      if (this.tokenCache.token && this.tokenCache.expireTime > (now + 300)) {
        console.log('使用缓存的阿里云Token');
        return this.tokenCache.token;
      }

      console.log('获取新的阿里云Token...');
      
      // 调用阿里云API获取新Token
      const result = await this.client.request('CreateToken');
      
      if (result && result.Token && result.Token.Id) {
        this.tokenCache.token = result.Token.Id;
        this.tokenCache.expireTime = result.Token.ExpireTime;
        
        console.log('阿里云Token获取成功:', {
          tokenLength: result.Token.Id.length,
          expireTime: new Date(result.Token.ExpireTime * 1000).toLocaleString()
        });
        
        return result.Token.Id;
      } else {
        throw new Error('Token响应格式错误');
      }
      
    } catch (error) {
      console.error('获取阿里云Token失败:', error);
      throw new Error(`获取语音识别Token失败: ${error.message}`);
    }
  }

  /**
   * 清除Token缓存
   */
  clearTokenCache() {
    this.tokenCache = {
      token: null,
      expireTime: 0
    };
  }

  /**
   * 检查Token是否有效
   * @returns {boolean} 是否有效
   */
  isTokenValid() {
    const now = Math.floor(Date.now() / 1000);
    return this.tokenCache.token && this.tokenCache.expireTime > now;
  }
}

// 创建单例实例
const aliyunTokenService = new AliyunTokenService();

module.exports = aliyunTokenService;
