const Chapter = require('../models/Chapter');

/**
 * @desc AI聊天处理
 * @route POST /api/ai/chat
 * @access Private
 */
const aiChat = async (req, res) => {
  try {
    const { message, context, character } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 获取用户的所有章节作为记忆
    const userChapters = await Chapter.findAll({
      where: {
        user_id: userId
      },
      order: [['created_at', 'DESC']]
    });

    // 构建AI角色的上下文
    const aiContext = buildAIContext(character, userChapters, message);

    // 生成AI回复（这里使用模拟回复，实际项目中可以接入真实的AI服务）
    const aiResponse = generateAIResponse(message, aiContext);

    res.status(200).json({
      success: true,
      message: 'AI回复生成成功',
      data: {
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI聊天错误:', error);
    res.status(500).json({
      success: false,
      message: 'AI聊天失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 构建AI角色的上下文
 */
const buildAIContext = (character, chapters, message) => {
  // 从章节中提取关键信息
  const memories = chapters.map(chapter => ({
    title: chapter.title,
    content: chapter.content,
    type: chapter.chapter_id.startsWith('diary_') ? '随记' : '章节',
    createdAt: chapter.created_at
  }));

  // 根据消息内容筛选相关记忆
  const relevantMemories = memories.filter(memory => {
    const searchText = (memory.title + ' ' + memory.content).toLowerCase();
    const query = message.toLowerCase();
    return searchText.includes(query) || 
           memory.title.toLowerCase().includes(query) ||
           memory.content.toLowerCase().includes(query);
  });

  return {
    character: character || '张无忌',
    memories: relevantMemories.slice(0, 5), // 最多5个相关记忆
    totalMemories: memories.length,
    userMessage: message
  };
};

/**
 * 生成AI回复（模拟实现）
 */
const generateAIResponse = (message, context) => {
  const { character, memories, totalMemories } = context;
  
  // 简单的关键词匹配回复
  const responses = {
    '你好': `你好！我是${character}，基于您的回忆录生成的AI角色。我有${totalMemories}个记忆片段，可以回答关于您回忆录内容的问题。`,
    '你是谁': `我是${character}，一个基于您回忆录内容生成的AI角色。我了解您在倚天屠龙记中的经历，可以回答相关问题。`,
    '回忆录': `根据我的记忆，您已经记录了${totalMemories}个片段。${memories.length > 0 ? `最近的内容包括：${memories[0].title}` : '还没有具体的回忆录内容。'}`,
    '经历': `根据我的记忆，您记录了很多精彩的经历。${memories.length > 0 ? `比如：${memories.map(m => m.title).join('、')}` : '请先记录一些您的经历。'}`,
    '故事': `我有很多关于您的故事可以分享。${memories.length > 0 ? `最近的故事是：${memories[0].content.substring(0, 100)}...` : '请先记录一些故事内容。'}`
  };

  // 查找匹配的回复
  for (const [keyword, response] of Object.entries(responses)) {
    if (message.includes(keyword)) {
      return response;
    }
  }

  // 如果有相关记忆，基于记忆回复
  if (memories.length > 0) {
    const randomMemory = memories[Math.floor(Math.random() * memories.length)];
    return `根据我的记忆，关于"${randomMemory.title}"，我记得：${randomMemory.content.substring(0, 200)}...`;
  }

  // 默认回复
  return `我是${character}，基于您的回忆录生成的AI角色。虽然我还不太了解您提到的内容，但我很乐意和您聊天。您可以告诉我更多关于您的经历吗？`;
};

module.exports = {
  aiChat
};
