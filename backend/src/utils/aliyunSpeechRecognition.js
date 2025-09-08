const RPCClient = require('@alicloud/pop-core').RPCClient;
const fs = require('fs');
const path = require('path');

class AliyunSpeechRecognition {
  constructor() {
    this.client = new RPCClient({
      accessKeyId: process.env.ALIYUN_AK_ID,
      accessKeySecret: process.env.ALIYUN_AK_SECRET,
      endpoint: 'https://nls-filetrans.cn-shanghai.aliyuncs.com',
      apiVersion: '2018-08-17'
    });
  }

  /**
   * 提交录音文件转写任务
   * @param {string} audioFileUrl - 音频文件的公网可访问URL
   * @param {object} options - 转写配置
   * @returns {Promise<string>} 任务ID
   */
  async submitFileTranscription(audioFileUrl, options = {}) {
    try {
      const params = {
        AppKey: process.env.ALIYUN_APP_KEY || 'default', // 需要在阿里云语音服务中创建应用获取
        FileLink: audioFileUrl,
        Version: '4.0',
        EnableWords: false,
        ...options
      };

      console.log('提交文件转写任务:', params);

      const result = await this.client.request('SubmitTask', params, {
        method: 'POST'
      });

      if (result && result.TaskId) {
        console.log('✅ 转写任务提交成功，任务ID:', result.TaskId);
        return result.TaskId;
      } else {
        throw new Error('提交转写任务失败: 无效的响应格式');
      }

    } catch (error) {
      console.error('❌ 提交文件转写任务失败:', error);
      throw error;
    }
  }

  /**
   * 查询转写任务结果
   * @param {string} taskId - 任务ID
   * @returns {Promise<object>} 转写结果
   */
  async getTranscriptionResult(taskId) {
    try {
      const params = {
        TaskId: taskId
      };

      const result = await this.client.request('GetTaskResult', params, {
        method: 'GET'
      });

      console.log('查询转写结果:', result);

      if (result && result.Result) {
        const resultData = JSON.parse(result.Result);
        
        if (resultData.Sentences && resultData.Sentences.length > 0) {
          // 提取所有句子的文本
          const transcript = resultData.Sentences
            .map(sentence => sentence.Text)
            .join('');
          
          return {
            status: 'completed',
            transcript: transcript,
            confidence: resultData.Sentences[0]?.Confidence || 0,
            taskId: taskId
          };
        } else {
          return {
            status: 'no_result',
            transcript: '',
            taskId: taskId
          };
        }
      } else if (result && result.StatusText === 'RUNNING') {
        return {
          status: 'processing',
          taskId: taskId
        };
      } else {
        throw new Error('获取转写结果失败: 无效的响应格式');
      }

    } catch (error) {
      console.error('❌ 获取转写结果失败:', error);
      throw error;
    }
  }

  /**
   * 轮询转写结果，直到完成
   * @param {string} taskId - 任务ID
   * @param {number} maxAttempts - 最大重试次数
   * @param {number} interval - 轮询间隔(毫秒)
   * @returns {Promise<object>} 最终转写结果
   */
  async pollTranscriptionResult(taskId, maxAttempts = 30, interval = 2000) {
    console.log(`🔄 开始轮询转写结果，任务ID: ${taskId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.getTranscriptionResult(taskId);
        
        if (result.status === 'completed') {
          console.log(`✅ 转写完成 (第${attempt}次查询):`, result.transcript);
          return result;
        } else if (result.status === 'no_result') {
          console.log('⚠️ 转写完成但无识别结果');
          return result;
        } else if (result.status === 'processing') {
          console.log(`⏳ 转写中... (第${attempt}/${maxAttempts}次查询)`);
          // 等待下次查询
          await new Promise(resolve => setTimeout(resolve, interval));
        } else {
          throw new Error('未知的转写状态: ' + result.status);
        }
      } catch (error) {
        console.error(`❌ 第${attempt}次查询失败:`, error);
        
        if (attempt === maxAttempts) {
          throw new Error(`转写查询失败，已达到最大重试次数(${maxAttempts})`);
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('转写超时，请稍后重试');
  }

  /**
   * 完整的文件转写流程
   * @param {string} audioFilePath - 本地音频文件路径
   * @param {string} publicFileUrl - 音频文件的公网访问URL
   * @returns {Promise<string>} 转写文本
   */
  async transcribeAudioFile(audioFilePath, publicFileUrl) {
    try {
      console.log('🎤 开始音频文件转写流程...');
      console.log('📁 本地文件:', audioFilePath);
      console.log('🌐 公网URL:', publicFileUrl);

      // 检查文件是否存在
      if (!fs.existsSync(audioFilePath)) {
        throw new Error('音频文件不存在: ' + audioFilePath);
      }

      // 提交转写任务
      const taskId = await this.submitFileTranscription(publicFileUrl);
      
      // 轮询获取结果
      const result = await this.pollTranscriptionResult(taskId);
      
      if (result.status === 'completed' && result.transcript) {
        console.log('🎉 转写成功:', result.transcript);
        return result.transcript;
      } else {
        throw new Error('转写失败或无识别结果');
      }

    } catch (error) {
      console.error('❌ 音频转写流程失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const aliyunSpeechRecognition = new AliyunSpeechRecognition();

module.exports = aliyunSpeechRecognition;
