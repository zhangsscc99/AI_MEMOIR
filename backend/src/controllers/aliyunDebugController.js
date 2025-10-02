const aliyunTokenService = require('../utils/aliyunToken');

/**
 * @desc 获取阿里云实时语音识别调试用 Token
 * @route GET /api/aliyun-speech/token
 * @access Public (调试用)
 */
const getAliyunDebugToken = async (req, res) => {
  try {
    const token = await aliyunTokenService.getToken();

    const { tokenCache = {} } = aliyunTokenService;
    const expireTime = tokenCache.expireTime ? new Date(tokenCache.expireTime * 1000) : null;

    res.status(200).json({
      success: true,
      message: '获取阿里云语音识别Token成功',
      data: {
        token,
        appKey: process.env.ALIYUN_APP_KEY,
        region: process.env.ALIYUN_REGION || 'cn-shanghai',
        expireAt: expireTime ? expireTime.toISOString() : null,
        websocketUrl: `wss://nls-gateway-${process.env.ALIYUN_REGION || 'cn-shanghai'}.aliyuncs.com/ws/v1`
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取阿里云语音识别Token失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAliyunDebugToken
};

