# 阿里云语音识别服务接口文档

## 概述

本项目集成了阿里云智能语音交互服务，为用户提供实时语音转文字功能。

## 环境配置

### 环境变量设置

在项目根目录的 `.env` 文件中设置以下环境变量：

```bash
# 阿里云访问凭证
ALIYUN_AK_ID=你的AccessKey_ID
ALIYUN_AK_SECRET=你的AccessKey_Secret
```

### 使用命令行设置环境变量

```bash
# 导航到后端目录
cd /Users/Zhuanz1/Desktop/memoir/backend

# 设置阿里云AccessKey ID
echo "ALIYUN_AK_ID=LTAI5tJ8qo1jXZGcg5XgSmXT" >> .env

# 设置阿里云AccessKey Secret
echo "ALIYUN_AK_SECRET=cFS1zCVT0mZXezXxwC4MTNh9yufOBd" >> .env
```

## API 接口

### 1. 获取语音识别Token

**接口地址**: `GET /api/speech/token`

**请求头**:
```
Authorization: Bearer {用户JWT Token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "获取语音识别Token成功",
  "data": {
    "token": "阿里云语音识别Token",
    "isValid": true
  }
}
```

### 2. 上传音频文件

**接口地址**: `POST /api/speech/upload`

**请求头**:
```
Authorization: Bearer {用户JWT Token}
Content-Type: multipart/form-data
```

**请求参数**:
- `audio`: 音频文件 (支持格式: wav, mp3, m4a, aac, flac, opus)
- 最大文件大小: 10MB

**响应示例**:
```json
{
  "success": true,
  "message": "音频文件上传成功",
  "data": {
    "file": {
      "filename": "audio-1234567890.wav",
      "originalName": "recording.wav",
      "size": 1024000,
      "mimetype": "audio/wav"
    },
    "fileUrl": "/uploads/audio/audio-1234567890.wav"
  }
}
```

### 3. 删除音频文件

**接口地址**: `DELETE /api/speech/audio/{filename}`

**请求头**:
```
Authorization: Bearer {用户JWT Token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "音频文件删除成功"
}
```

## 前端集成

### 录制按钮功能

在录制页面(`/pages/recording/index.vue`)中，录制按钮已集成阿里云语音识别功能：

1. **开始录制**: 用户按住录制按钮开始录音
2. **停止录制**: 用户松开录制按钮停止录音
3. **自动转录**: 录制完成后自动调用阿里云语音识别服务
4. **文本插入**: 转录结果自动添加到文本输入框

### 调用流程

```javascript
// 1. 获取阿里云Token
const tokenResponse = await uni.request({
  url: 'http://localhost:3001/api/speech/token',
  method: 'GET',
  header: {
    'Authorization': `Bearer ${token}`
  }
});

// 2. 使用Token进行语音识别
const speechToken = tokenResponse.data.data.token;
// ... 调用阿里云语音识别SDK
```

## 技术架构

### 后端组件

1. **Token服务** (`/utils/aliyunToken.js`)
   - 自动获取和缓存阿里云Token
   - Token过期自动刷新
   - 错误处理和重试机制

2. **语音控制器** (`/controllers/speechController.js`)
   - 提供Token获取接口
   - 音频文件上传处理
   - 文件管理功能

3. **路由配置** (`/routes/speech.js`)
   - REST API路由定义
   - 中间件集成
   - 权限验证

### 安全特性

- JWT身份验证
- 文件类型验证
- 文件大小限制
- AccessKey安全存储

## 部署注意事项

1. **环境变量**: 确保生产环境中正确设置ALIYUN_AK_ID和ALIYUN_AK_SECRET
2. **文件存储**: 上传的音频文件存储在`/uploads/audio/`目录
3. **权限控制**: 所有语音相关接口都需要用户登录
4. **错误处理**: 完善的错误处理和用户友好的错误提示

## 常见问题

### 1. Token获取失败
- 检查AccessKey配置是否正确
- 确认网络连接是否正常
- 查看后端日志获取详细错误信息

### 2. 音频上传失败
- 检查文件格式是否支持
- 确认文件大小不超过10MB
- 验证用户登录状态

### 3. 语音识别准确率
- 确保录音环境安静
- 说话清晰，语速适中
- 使用标准普通话

## 开发调试

### 启动服务
```bash
cd /Users/Zhuanz1/Desktop/memoir/backend
npm start
```

### 查看日志
服务启动后会显示所有可用的API端点，包括语音识别相关接口。

### 测试接口
可以使用Postman或curl命令测试接口功能：

```bash
# 获取Token
curl -X GET http://localhost:3001/api/speech/token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 更新日志

- 2025-01-XX: 初始版本，集成阿里云语音识别服务
- 支持Token自动管理和缓存
- 支持音频文件上传和管理
- 前端录制按钮集成语音识别功能
