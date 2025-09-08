const Nls = require("alibabacloud-nls");
const fs = require("fs");

class AliyunSpeechService {
  constructor() {
    this.url = "wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1";
    this.appkey = process.env.ALIYUN_APP_KEY;
  }

  /**
   * 获取阿里云Token（使用现有的Token服务）
   */
  async getToken() {
    const aliyunTokenService = require('./aliyunToken');
    return await aliyunTokenService.getToken();
  }

  /**
   * 模拟语音识别测试
   * @param {string} testText - 测试文本
   * @returns {Promise<string>} 识别结果
   */
  async testSpeechRecognition(testText = "语音识别配置测试") {
    try {
      console.log('🧪 开始阿里云语音识别配置测试...');
      
      // 验证必要的配置
      if (!this.appkey || this.appkey === 'your_app_key_here') {
        throw new Error('ALIYUN_APP_KEY 未正确配置');
      }

      if (!process.env.ALIYUN_AK_ID || !process.env.ALIYUN_AK_SECRET) {
        throw new Error('阿里云AccessKey未正确配置');
      }

      // 获取Token
      const token = await this.getToken();
      console.log('✅ Token获取成功:', token.substring(0, 20) + '...');

      // 模拟语音识别流程（因为需要真实音频数据才能完整测试）
      console.log('🎤 配置验证完成，模拟语音识别结果...');
      
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      const recognitionResult = `${testText}（配置验证成功，AppKey: ${this.appkey.substring(0, 8)}...）`;
      
      console.log('✅ 语音识别测试完成:', recognitionResult);
      return recognitionResult;

    } catch (error) {
      console.error('❌ 语音识别测试失败:', error);
      throw new Error(`语音识别配置错误: ${error.message}`);
    }
  }

  /**
   * 实时语音识别（用于真实音频数据）
   * @param {Buffer} audioBuffer - 音频数据
   * @returns {Promise<string>} 识别结果
   */
  async recognizeAudio(audioBuffer) {
    try {
      console.log('🎤 开始实时语音识别...');
      
      const token = await this.getToken();
      
      return new Promise((resolve, reject) => {
        const st = new Nls.SpeechTranscription({
          url: this.url,
          appkey: this.appkey,
          token: token
        });

        let finalResult = '';

        // 设置事件监听
        st.on("started", (msg) => {
          console.log("语音识别开始:", msg);
        });

        st.on("changed", (msg) => {
          console.log("识别中间结果:", msg);
        });

        st.on("completed", (msg) => {
          console.log("语音识别完成:", msg);
          try {
            const result = JSON.parse(msg);
            finalResult = result.result || '识别完成但无结果';
            resolve(finalResult);
          } catch (parseError) {
            finalResult = msg;
            resolve(finalResult);
          }
        });

        st.on("failed", (msg) => {
          console.error("语音识别失败:", msg);
          reject(new Error(`语音识别失败: ${msg}`));
        });

        st.on("closed", () => {
          console.log("连接已关闭");
          if (!finalResult) {
            resolve('识别会话结束');
          }
        });

        // 启动识别
        st.start(st.defaultStartParams(), true, 6000)
          .then(() => {
            console.log('✅ 语音识别会话启动成功');
            
            // 发送音频数据
            if (audioBuffer && audioBuffer.length > 0) {
              const chunkSize = 1024;
              let offset = 0;
              
              const sendChunk = () => {
                if (offset < audioBuffer.length) {
                  const chunk = audioBuffer.slice(offset, offset + chunkSize);
                  if (st.sendAudio(chunk)) {
                    offset += chunkSize;
                    setTimeout(sendChunk, 20); // 20ms间隔发送
                  } else {
                    reject(new Error('发送音频数据失败'));
                  }
                } else {
                  // 音频发送完成，关闭连接
                  st.close().catch(closeError => {
                    console.error('关闭连接时出错:', closeError);
                  });
                }
              };
              
              sendChunk();
            } else {
              // 没有音频数据，直接关闭
              st.close().catch(closeError => {
                console.error('关闭连接时出错:', closeError);
              });
            }
          })
          .catch(startError => {
            console.error('启动语音识别失败:', startError);
            reject(startError);
          });

        // 设置超时
        setTimeout(() => {
          if (!finalResult) {
            st.shutdown();
            reject(new Error('语音识别超时'));
          }
        }, 30000); // 30秒超时
      });

    } catch (error) {
      console.error('❌ 实时语音识别错误:', error);
      throw error;
    }
  }
}

// 创建单例实例
const aliyunSpeechService = new AliyunSpeechService();

module.exports = aliyunSpeechService;
