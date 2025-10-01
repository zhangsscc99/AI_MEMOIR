const https = require('https');
const baiduTokenService = require('./baiduToken');

class BaiduSpeechService {
  constructor() {
    this.sampleRate = Number(process.env.BAIDU_SPEECH_SAMPLE_RATE || 16000);
    this.devPid = Number(process.env.BAIDU_SPEECH_DEV_PID || 15372);
    this.cuid = process.env.BAIDU_SPEECH_CUID || 'memoir-memo-device';
  }

  /**
   * 发送 HTTPS POST 请求并返回 JSON
   * @param {string} url 请求地址
   * @param {object} body 请求体
   * @returns {Promise<object>}
   */
  postJson(url, body) {
    const payload = JSON.stringify(body);

    const { hostname, pathname, search } = new URL(url);

    const options = {
      hostname,
      path: `${pathname}${search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`解析百度语音识别响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`百度语音识别请求失败: ${error.message}`));
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * 根据文件格式推断百度识别需要的 format 参数
   * @param {string} filename
   * @returns {string}
   */
  detectFormat(filename = '') {
    const ext = filename.split('.').pop().toLowerCase();
    const supported = ['pcm', 'wav', 'mp3', 'm4a', 'aac', 'amr', 'flac', 'ogg', 'opus'];
    if (supported.includes(ext)) {
      return ext === 'm4a' ? 'm4a' : ext;
    }
    return 'pcm';
  }

  /**
   * 测试百度语音识别配置
   * @returns {Promise<string>}
   */
  async testSpeechRecognition() {
    const token = await baiduTokenService.getToken();
    const appId = process.env.BAIDU_SPEECH_APP_ID;
    return `百度语音识别配置验证成功 (AppID: ${appId || '未设置'}, Token前缀: ${token.slice(0, 8)}...)`;
  }

  /**
   * 调用百度语音识别 API
   * @param {Buffer} audioBuffer 音频数据
   * @param {{ filename?: string, format?: string, sampleRate?: number, devPid?: number, cuid?: string }} options
   * @returns {Promise<string>}
   */
  async recognizeAudio(audioBuffer, options = {}) {
    if (!audioBuffer || !audioBuffer.length) {
      throw new Error('音频数据为空');
    }

    const token = await baiduTokenService.getToken();
    const sampleRate = options.sampleRate || this.sampleRate;
    const devPid = options.devPid || this.devPid;
    const cuid = options.cuid || this.cuid;
    const format = options.format || this.detectFormat(options.filename);

    const payload = {
      format,
      rate: sampleRate,
      channel: 1,
      dev_pid: devPid,
      token,
      cuid,
      speech: audioBuffer.toString('base64'),
      len: audioBuffer.length
    };

    const response = await this.postJson('https://vop.baidu.com/server_api', payload);

    if (typeof response.err_no !== 'undefined' && response.err_no !== 0) {
      const message = response.err_msg || '百度语音识别返回错误';
      throw new Error(`${message} (err_no: ${response.err_no})`);
    }

    let result = '';
    if (Array.isArray(response.result)) {
      result = response.result.join('');
    } else if (typeof response.result === 'string') {
      result = response.result;
    }

    if (!result) {
      result = '识别完成但无结果';
    }

    return result;
  }
}

module.exports = new BaiduSpeechService();
