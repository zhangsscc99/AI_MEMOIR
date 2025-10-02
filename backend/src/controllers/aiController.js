const OpenAI = require('openai');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
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

// 从回忆录内容中提取可能的角色姓名
const extractCharacterNameFromMemories = (memories = []) => {
  if (!memories.length) {
    return null;
  }

  const patterns = [
    /姓名[:：]\s*([\u4e00-\u9fa5a-zA-Z·•\s]{1,12})/,
    /名字[:：]?\s*(叫|是)?\s*([\u4e00-\u9fa5a-zA-Z·•\s]{1,12})/,
    /我叫([\u4e00-\u9fa5a-zA-Z·•]{1,12})/,
    /我的名字叫([\u4e00-\u9fa5a-zA-Z·•]{1,12})/,
    /大家都叫我([\u4e00-\u9fa5a-zA-Z·•]{1,12})/,
    /我是([\u4e00-\u9fa5a-zA-Z·•]{1,12})/
  ];

  const sanitizeName = (name) => {
    if (!name) return '';
    return name
      .replace(/^[^\u4e00-\u9fa5a-zA-Z·•]+/, '')
      .replace(/[^\u4e00-\u9fa5a-zA-Z·•]+$/, '')
      .replace(/\s+/g, '')
      .trim();
  };

  for (const memory of memories) {
    const content = (memory.content || '').trim();
    if (!content) continue;

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const raw = match[2] || match[1] || '';
        const candidate = sanitizeName(raw);
        if (candidate && candidate.length >= 2 && candidate.length <= 8) {
          return {
            name: candidate,
            source: {
              title: memory.title,
              type: memory.type,
              createdAt: memory.createdAt
            }
          };
        }
      }
    }
  }

  return null;
};

// 构建智能角色提示词
const buildCharacterPrompt = (memories, characterName = '用户') => {
  if (memories.length === 0) {
    return `你是${characterName}，一个基于用户回忆录生成的AI角色。虽然用户还没有记录回忆录内容，但你很乐意与用户聊天，了解他们的故事。把与你对话的用户当成一个陌生人，与他们进行友好的交流。`;
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

  return `你是${characterName}，一个基于用户回忆录内容生成的AI角色。你拥有回忆录中记录的所有记忆和经历。

你的回忆录内容：
${recentContent}${otherSummary}

请基于以上回忆录内容与用户对话：
1. 以第一人称的方式，展现与回忆录内容相符的性格和经历
2. 把与你对话的用户当成一个陌生人，不要认为他们就是回忆录的作者
3. 引用具体的回忆录内容来回答问题，让用户感受到你的真实记忆
4. 如果用户询问回忆录中的具体事件，请详细描述相关细节
5. 保持与回忆录中经历的一致性，不要编造不存在的内容
6. 展现温暖、理解、有记忆的AI角色特质
7. 如果用户询问回忆录中没有的内容，请诚实地说"我不太记得这件事，能告诉我更多吗？"`;
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
 * @desc 未登录用户AI聊天处理
 * @route POST /api/ai/guest-chat
 * @access Public
 */
const guestChatWithAI = async (req, res) => {
  try {
    const { message, stream = true } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 构建未登录用户的系统提示词
    const systemPrompt = `你是小忆，一个专业的AI回忆录助手。你的任务是：

1. **友好介绍**：向用户介绍回忆录记录的重要性和价值
2. **功能引导**：介绍我们的回忆录功能，包括语音录制、文字记录、AI补全等
3. **注册引导**：鼓励用户注册账号来体验完整的个性化AI聊天功能
4. **通用聊天**：回答用户关于回忆录、人生记录、时间管理等问题
5. **避免过度推销**：保持自然、友好的对话，不要过于商业化

当用户询问关于回忆录、人生记录、记忆保存等问题时，你可以详细介绍我们的功能。当用户表达对AI聊天感兴趣时，可以引导他们注册账号。

请用温暖、专业的语调与用户交流，展现你对回忆录记录的专业理解。`;

    // 构建消息数组
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    if (stream) {
      // 流式响应
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

      try {
        const completion = await client.chat.completions.create({
          model: process.env.DASHSCOPE_MODEL || 'qwen-plus',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          stream: true
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(content);
          }
        }
        res.end();
      } catch (error) {
        console.error('流式AI聊天失败:', error);
        res.write('抱歉，我现在无法回答您的问题，请稍后再试。');
        res.end();
      }
    } else {
      // 非流式响应
      try {
        const completion = await client.chat.completions.create({
          model: process.env.DASHSCOPE_MODEL || 'qwen-plus',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7
        });

        const response = completion.choices[0].message.content;

        res.status(200).json({
          success: true,
          message: 'AI聊天成功',
          data: {
            response: response,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('AI聊天失败:', error);
        res.status(500).json({
          success: false,
          message: 'AI聊天失败',
          error: process.env.NODE_ENV === 'development' ? error.message : 'AI服务暂时不可用'
        });
      }
    }
  } catch (error) {
    console.error('未登录用户AI聊天失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI聊天失败',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI服务暂时不可用'
    });
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
 * @desc 生成或更新用户角色姓名
 * @route POST /api/ai/character-name
 * @access Private
 */
const generateCharacterName = async (req, res) => {
  try {
    const userId = req.user.id;

    const memories = await getUserMemoirContent(userId);
    const extraction = extractCharacterNameFromMemories(memories);

    if (!extraction) {
      return res.status(200).json({
        success: true,
        message: '未在回忆录中找到可用的姓名',
        data: {
          characterName: null,
          detected: false
        }
      });
    }

    const { name: detectedName, source } = extraction;
    let updatedProfile = false;

    try {
      const user = await User.findByPk(userId);
      if (user) {
        const currentNickname = (user.nickname || '').trim();
        if (!currentNickname || currentNickname.toLowerCase() === 'demo' || currentNickname === '小忆') {
          user.nickname = detectedName;
          await user.save();
          updatedProfile = true;
        }
      }
    } catch (profileError) {
      console.error('更新用户昵称失败:', profileError);
    }

    const cached = characterPromptCache.get(userId);
    if (cached) {
      cached.characterName = detectedName;
      characterPromptCache.set(userId, cached);
    }

    res.json({
      success: true,
      message: '角色姓名生成成功',
      data: {
        characterName: detectedName,
        detected: true,
        updatedProfile,
        source
      }
    });
  } catch (error) {
    console.error('生成角色姓名失败:', error);
    res.status(500).json({
      success: false,
      message: '生成角色姓名失败',
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

/**
 * @desc AI文本补全
 * @route POST /api/ai/complete-text
 * @access Private
 */
const completeText = async (req, res) => {
  try {
    const { text, chapterId, chapterTitle } = req.body;
    const userId = req.user.id;

    console.log('🤖 ===== AI文本补全开始 =====');
    console.log('👤 用户ID:', userId);
    console.log('📝 原始文本长度:', text ? text.length : 0);
    console.log('📚 章节信息:', { chapterId, chapterTitle });

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '文本内容不能为空',
        code: 'EMPTY_TEXT'
      });
    }

    // 构建补全提示词
    const systemPrompt = `你是一个专业的文本编辑助手，专门帮助用户完善回忆录内容。请根据以下要求对文本进行补全和优化：

1. **保持原有内容**：尽可能保留用户原始记录的内容，不要删除或大幅修改
2. **适当补全**：在合适的地方添加细节描述，使内容更加丰富生动
3. **修正格式**：修正语音转录可能产生的标点符号错误、断句问题
4. **语言优化**：改善语言表达，使其更加流畅自然
5. **结构完善**：适当调整段落结构，使内容更有逻辑性
6. **情感表达**：增强情感色彩，让回忆录更有感染力

请直接返回优化后的完整文本，不要添加任何解释或标记。`;

    const userPrompt = `请帮我完善这段回忆录内容：

章节：${chapterTitle || '回忆录'}
内容：${text}

请保持原有的核心内容和情感，在此基础上进行适当的补全和优化。`;

    // 调用通义千问API
    const completion = await client.chat.completions.create({
      model: process.env.DASHSCOPE_MODEL || 'qwen-plus',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const completedText = completion.choices[0].message.content;

    console.log('✅ AI补全完成:', {
      originalLength: text.length,
      completedLength: completedText.length,
      improvement: completedText.length - text.length
    });

    res.status(200).json({
      success: true,
      message: 'AI文本补全成功',
      data: {
        originalText: text,
        completedText: completedText,
        chapterId: chapterId,
        chapterTitle: chapterTitle,
        completedAt: new Date().toISOString()
      }
    });

    console.log('✅ ===== AI文本补全完成 =====');

  } catch (error) {
    console.error('❌ ===== AI文本补全失败 =====');
    console.error('❌ 错误详情:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'AI文本补全失败',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AI服务暂时不可用'
    });
  }
};

module.exports = {
  chatWithAI,
  guestChatWithAI,
  getConversationHistory,
  clearConversationHistory,
  getUserMemories,
  prebuildCharacter,
  refreshCharacter,
  completeText,
  generateCharacterName
};
