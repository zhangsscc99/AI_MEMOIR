const OpenAI = require('openai');
const Chapter = require('../models/Chapter');
require('dotenv').config();

// 初始化通义千问客户端
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL,
});

// 存储用户对话历史（生产环境建议使用Redis）
const userConversations = new Map();

// 获取用户对话历史
const getUserConversation = (userId) => {
  if (!userConversations.has(userId)) {
    userConversations.set(userId, []);
  }
  return userConversations.get(userId);
};

// 添加消息到对话历史
const addMessageToHistory = (userId, role, content) => {
  const conversation = getUserConversation(userId);
  conversation.push({ role, content });
  
  // 限制对话历史长度，避免超出token限制
  if (conversation.length > 20) {
    conversation.splice(0, conversation.length - 20);
  }
};

// 获取用户回忆录内容
const getUserMemoirContent = async (userId) => {
  try {
    const chapters = await Chapter.findAll({
      where: {
        user_id: userId
      },
      order: [['created_at', 'DESC']],
      limit: 10 // 只取最近10个章节
    });

    return chapters.map(chapter => ({
      title: chapter.title,
      content: chapter.content,
      type: chapter.chapter_id && chapter.chapter_id.startsWith('diary_') ? '随记' : '章节',
      createdAt: chapter.created_at
    }));
  } catch (error) {
    console.error('获取用户回忆录内容失败:', error);
    return [];
  }
};

/**
 * @desc AI聊天处理（支持流式输出和多轮对话）
 * @route POST /api/ai/chat
 * @access Private
 */
const chatWithAI = async (req, res) => {
  try {
    const { message, stream = true } = req.body;
    const userId = req.user.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 获取用户对话历史
    const conversation = getUserConversation(userId);
    
    // 添加用户消息到历史
    addMessageToHistory(userId, 'user', message);

    // 获取用户回忆录内容
    const memoirContent = await getUserMemoirContent(userId);
    
    // 构建系统提示词
    const systemPrompt = `你是基于用户回忆录生成的AI角色。请根据用户的回忆录内容与用户进行自然、有趣的对话。

用户回忆录信息：
${memoirContent.length > 0 ? memoirContent.map(item => 
  `- ${item.title} (${item.type}): ${item.content.substring(0, 200)}...`
).join('\n') : '暂无回忆录内容'}

请以第一人称的方式与用户对话，让用户感受到你是一个有记忆、有情感的AI角色。如果用户询问关于回忆录的问题，请基于回忆录内容回答；如果是其他话题，请以友好、有帮助的方式回应。`;

    // 构建完整的消息数组
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation
    ];

    if (stream) {
      // 流式输出
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      const stream = await client.chat.completions.create({
        model: process.env.DASHSCOPE_MODEL || 'qwen-plus',
        messages: messages,
        stream: true,
        stream_options: { include_usage: true }
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ 
              type: 'content', 
              content: content 
            })}\n\n`);
          }
        } else if (chunk.usage) {
          // 添加AI回复到对话历史
          addMessageToHistory(userId, 'assistant', fullResponse);
          
          res.write(`data: ${JSON.stringify({ 
            type: 'usage', 
            usage: chunk.usage 
          })}\n\n`);
          res.write(`data: ${JSON.stringify({ 
            type: 'done' 
          })}\n\n`);
          res.end();
        }
      }
    } else {
      // 非流式输出
      const completion = await client.chat.completions.create({
        model: process.env.DASHSCOPE_MODEL || 'qwen-plus',
        messages: messages,
        stream: false
      });

      const aiResponse = completion.choices[0].message.content;
      
      // 添加AI回复到对话历史
      addMessageToHistory(userId, 'assistant', aiResponse);

      res.json({
        success: true,
        message: 'AI回复成功',
        data: {
          response: aiResponse,
          usage: completion.usage
        }
      });
    }
  } catch (error) {
    console.error('AI聊天错误:', error);
    
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: 'AI聊天失败，请稍后重试' 
      })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        success: false,
        message: 'AI聊天失败，请稍后重试',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

/**
 * @desc 获取对话历史
 * @route GET /api/ai/history
 * @access Private
 */
const getConversationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = getUserConversation(userId);
    
    res.json({
      success: true,
      message: '获取对话历史成功',
      data: {
        conversation: conversation
      }
    });
  } catch (error) {
    console.error('获取对话历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取对话历史失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 清空对话历史
 * @route DELETE /api/ai/history
 * @access Private
 */
const clearConversationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    userConversations.set(userId, []);
    
    res.json({
      success: true,
      message: '清空对话历史成功'
    });
  } catch (error) {
    console.error('清空对话历史错误:', error);
    res.status(500).json({
      success: false,
      message: '清空对话历史失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 获取用户记忆（回忆录内容）
 * @route GET /api/ai/memories
 * @access Private
 */
const getUserMemories = async (req, res) => {
  try {
    const userId = req.user.id;
    const memories = await getUserMemoirContent(userId);
    
    res.json({
      success: true,
      message: '获取用户记忆成功',
      data: {
        memories: memories
      }
    });
  } catch (error) {
    console.error('获取用户记忆错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户记忆失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  chatWithAI,
  getConversationHistory,
  clearConversationHistory,
  getUserMemories
};