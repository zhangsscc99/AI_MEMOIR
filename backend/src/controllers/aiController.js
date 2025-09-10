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

// 存储用户角色提示词缓存
const characterPromptCache = new Map();

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
      order: [['created_at', 'DESC']]
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

// 构建智能角色提示词
const buildCharacterPrompt = (memories, characterName = '张无忌') => {
  if (memories.length === 0) {
    return `你是${characterName}，一个基于用户回忆录生成的AI角色。虽然用户还没有记录回忆录内容，但你很乐意与用户聊天，了解他们的故事。`;
  }

  // 按时间排序，最新的在前
  const sortedMemories = memories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 取最近5个详细内容，其他做摘要
  const recentMemories = sortedMemories.slice(0, 5);
  const otherMemories = sortedMemories.slice(5);
  
  const recentContent = recentMemories.map(item => 
    `【${item.type}】${item.title}
时间：${new Date(item.createdAt).toLocaleDateString()}
内容：${item.content.length > 300 ? item.content.substring(0, 300) + '...' : item.content}`
  ).join('\n\n');

  const otherSummary = otherMemories.length > 0 ? 
    `\n\n其他记忆片段：${otherMemories.map(m => m.title).join('、')}等${otherMemories.length}个片段` : '';

  return `你是${characterName}，一个基于用户真实回忆录内容生成的AI角色。

用户回忆录内容：
${recentContent}${otherSummary}

请基于以上回忆录内容与用户对话：
1. 以第一人称的方式，展现与回忆录内容相符的性格和经历
2. 引用具体的回忆录内容来回答问题，让用户感受到你的真实记忆
3. 如果用户询问回忆录中的具体事件，请详细描述相关细节
4. 保持与用户真实经历的一致性，不要编造不存在的内容
5. 展现温暖、理解、有记忆的AI角色特质
6. 如果用户询问回忆录中没有的内容，请诚实地说"我不太记得这件事，能告诉我更多吗？"`;
};

// 预构建用户角色
const preBuildCharacter = async (userId) => {
  try {
    console.log(`开始预构建用户 ${userId} 的角色...`);
    const memories = await getUserMemoirContent(userId);
    const characterPrompt = buildCharacterPrompt(memories);
    
    // 缓存角色提示词
    characterPromptCache.set(userId, {
      prompt: characterPrompt,
      memoryCount: memories.length,
      lastUpdated: new Date(),
      memories: memories
    });
    
    console.log(`用户 ${userId} 角色预构建完成，记忆数量: ${memories.length}`);
    return characterPrompt;
  } catch (error) {
    console.error('预构建角色失败:', error);
    return null;
  }
};

// 获取缓存的角色提示词
const getCachedCharacterPrompt = (userId) => {
  const cached = characterPromptCache.get(userId);
  if (cached) {
    console.log(`使用缓存的角色提示词，用户: ${userId}, 记忆数量: ${cached.memoryCount}`);
    return cached.prompt;
  }
  return null;
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

    // 获取缓存的角色提示词
    let systemPrompt = getCachedCharacterPrompt(userId);
    
    // 如果没有缓存，则实时构建（降级方案）
    if (!systemPrompt) {
      console.log(`用户 ${userId} 角色未缓存，实时构建...`);
      const memories = await getUserMemoirContent(userId);
      systemPrompt = buildCharacterPrompt(memories);
      
      // 缓存构建的角色
      characterPromptCache.set(userId, {
        prompt: systemPrompt,
        memoryCount: memories.length,
        lastUpdated: new Date(),
        memories: memories
      });
    }

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

/**
 * @desc 预构建用户角色
 * @route POST /api/ai/prebuild
 * @access Private
 */
const prebuildCharacter = async (req, res) => {
  try {
    const userId = req.user.id;
    const characterPrompt = await preBuildCharacter(userId);
    
    if (characterPrompt) {
      res.json({
        success: true,
        message: '角色预构建成功',
        data: {
          memoryCount: characterPromptCache.get(userId)?.memoryCount || 0
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '角色预构建失败'
      });
    }
  } catch (error) {
    console.error('预构建角色错误:', error);
    res.status(500).json({
      success: false,
      message: '角色预构建失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc 刷新用户角色缓存
 * @route POST /api/ai/refresh
 * @access Private
 */
const refreshCharacter = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 清除旧缓存
    characterPromptCache.delete(userId);
    
    // 重新构建
    const characterPrompt = await preBuildCharacter(userId);
    
    if (characterPrompt) {
      res.json({
        success: true,
        message: '角色缓存刷新成功',
        data: {
          memoryCount: characterPromptCache.get(userId)?.memoryCount || 0
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '角色缓存刷新失败'
      });
    }
  } catch (error) {
    console.error('刷新角色缓存错误:', error);
    res.status(500).json({
      success: false,
      message: '角色缓存刷新失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  chatWithAI,
  getConversationHistory,
  clearConversationHistory,
  getUserMemories,
  prebuildCharacter,
  refreshCharacter
};