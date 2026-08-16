const { sequelize } = require('../config/database');

// 导入所有模型
const User = require('./User');
const Memoir = require('./Memoir');
const Question = require('./Question');
const Answer = require('./Answer');
const Diary = require('./Diary');
const Chapter = require('./Chapter');

// 定义模型关联关系

// 用户与回忆录的关系（一对多）
User.hasMany(Memoir, {
  foreignKey: 'user_id',
  as: 'memoirs',
  onDelete: 'CASCADE'
});
Memoir.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 用户与日记的关系（一对多）
User.hasMany(Diary, {
  foreignKey: 'user_id',
  as: 'diaries',
  onDelete: 'CASCADE'
});
Diary.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 用户与答案的关系（一对多）
User.hasMany(Answer, {
  foreignKey: 'user_id',
  as: 'answers',
  onDelete: 'CASCADE'
});
Answer.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 回忆录与答案的关系（一对多）
Memoir.hasMany(Answer, {
  foreignKey: 'memoir_id',
  as: 'answers',
  onDelete: 'CASCADE'
});
Answer.belongsTo(Memoir, {
  foreignKey: 'memoir_id',
  as: 'memoir'
});

// 问题与答案的关系（一对多）
Question.hasMany(Answer, {
  foreignKey: 'question_id',
  as: 'answers',
  onDelete: 'CASCADE'
});
Answer.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question'
});

// 用户与章节的关系（一对多）
User.hasMany(Chapter, {
  foreignKey: 'user_id',
  as: 'chapters',
  onDelete: 'CASCADE'
});
Chapter.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 数据库初始化函数
const initDatabase = async () => {
  try {
    console.log('🔄 开始初始化数据库...');
    
    // 同步所有模型到数据库
    await sequelize.sync({ force: false }); // force: false 表示不删除现有表，但会创建新表和新字段
    
    // 手动添加缺失的字段
    await addMissingColumns();
    
    console.log('✅ 数据库表结构同步完成');
    
    // 初始化默认数据
    await initDefaultData();
    
    console.log('✅ 数据库初始化完成');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

// 手动添加缺失的字段
const addMissingColumns = async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // 检查 chapters 表是否存在 background_image 字段
    const tableInfo = await queryInterface.describeTable('chapters');
    
    if (!tableInfo.background_image) {
      console.log('🔧 添加 background_image 字段到 chapters 表...');
      await queryInterface.addColumn('chapters', 'background_image', {
        type: sequelize.Sequelize.STRING(500),
        allowNull: true,
        comment: '章节背景图片路径'
      });
      console.log('✅ background_image 字段添加成功');
    } else {
      console.log('✅ background_image 字段已存在');
    }

    if (!tableInfo.images) {
      console.log('🔧 添加 images 字段到 chapters 表...');
      await queryInterface.addColumn('chapters', 'images', {
        type: sequelize.Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
        comment: '章节图片路径列表'
      });
      console.log('✅ images 字段添加成功');
    } else {
      console.log('✅ images 字段已存在');
    }

    if (!tableInfo.image_analyses) {
      console.log('🔧 添加 image_analyses 字段到 chapters 表...');
      await queryInterface.addColumn('chapters', 'image_analyses', {
        type: sequelize.Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
        comment: '章节图片的AI识别文字与使用状态'
      });
      console.log('✅ image_analyses 字段添加成功');
    } else {
      console.log('✅ image_analyses 字段已存在');
    }
  } catch (error) {
    console.log('ℹ️ 添加字段时出现错误（可能字段已存在）:', error.message);
  }
};

// 初始化默认数据
const initDefaultData = async () => {
  try {
    // 检查是否已有问题数据
    const questionCount = await Question.count();
    
    if (questionCount === 0) {
      console.log('🔄 初始化默认问题...');
      
      const defaultQuestions = [
        {
          category: '基本信息',
          question_text: '请介绍一下您的基本信息，包括姓名、出生年月等。',
          question_type: 'text',
          order_index: 1,
          is_required: true
        },
        {
          category: '童年记忆',
          question_text: '请分享一个您印象最深刻的童年回忆。',
          question_type: 'text',
          order_index: 2,
          is_required: true
        },
        {
          category: '家庭背景',
          question_text: '请描述您的家庭背景和成长环境。',
          question_type: 'text',
          order_index: 3,
          is_required: true
        },
        {
          category: '教育经历',
          question_text: '请介绍您的教育经历，包括学校、专业等。',
          question_type: 'text',
          order_index: 4,
          is_required: true
        },
        {
          category: '职业生涯',
          question_text: '请分享您的职业发展历程。',
          question_type: 'text',
          order_index: 5,
          is_required: true
        },
        {
          category: '人生转折点',
          question_text: '您人生中最重要的转折点是什么？',
          question_type: 'text',
          order_index: 6,
          is_required: true
        },
        {
          category: '爱好兴趣',
          question_text: '您有哪些爱好和兴趣？它们如何影响了您的生活？',
          question_type: 'text',
          order_index: 7,
          is_required: false
        },
        {
          category: '人际关系',
          question_text: '请描述对您影响最大的人，以及他们如何改变了您。',
          question_type: 'text',
          order_index: 8,
          is_required: true
        },
        {
          category: '挑战与困难',
          question_text: '您遇到过的最大挑战是什么？您是如何克服的？',
          question_type: 'text',
          order_index: 9,
          is_required: true
        },
        {
          category: '成就与骄傲',
          question_text: '您最引以为豪的成就是什么？',
          question_type: 'text',
          order_index: 10,
          is_required: true
        },
        {
          category: '价值观',
          question_text: '您的核心价值观是什么？它们是如何形成的？',
          question_type: 'text',
          order_index: 11,
          is_required: true
        },
        {
          category: '人生感悟',
          question_text: '您想对年轻的自己说些什么？',
          question_type: 'text',
          order_index: 12,
          is_required: true
        },
        {
          category: '未来展望',
          question_text: '您对未来有什么期望和计划？',
          question_type: 'text',
          order_index: 13,
          is_required: false
        },
        {
          category: '智慧分享',
          question_text: '您想传递给后代的最重要的人生智慧是什么？',
          question_type: 'text',
          order_index: 14,
          is_required: true
        },
        {
          category: '感恩之心',
          question_text: '您最感谢的人或事是什么？',
          question_type: 'text',
          order_index: 15,
          is_required: true
        }
      ];
      
      // 添加更多问题以达到36个
      const additionalQuestions = [
        { category: '童年记忆', question_text: '您的第一个朋友是谁？你们之间有什么特殊的回忆？', order_index: 16 },
        { category: '家庭背景', question_text: '您的父母是什么样的人？他们教给您什么重要的人生道理？', order_index: 17 },
        { category: '教育经历', question_text: '您最喜欢的老师是谁？他们如何影响了您？', order_index: 18 },
        { category: '青春岁月', question_text: '您的青春期是怎样的？有什么特别的经历？', order_index: 19 },
        { category: '爱情故事', question_text: '请分享您的爱情故事，您是如何遇到人生伴侣的？', order_index: 20 },
        { category: '为人父母', question_text: '成为父母后，您的人生观有什么改变？', order_index: 21 },
        { category: '工作体验', question_text: '您记忆中最有意义的一份工作是什么？', order_index: 22 },
        { category: '旅行见闻', question_text: '您去过的最难忘的地方是哪里？', order_index: 23 },
        { category: '健康经历', question_text: '您有过什么健康挑战？如何面对的？', order_index: 24 },
        { category: '财务管理', question_text: '您学到的最重要的理财经验是什么？', order_index: 25 },
        { category: '社会参与', question_text: '您参与过哪些社会活动或公益事业？', order_index: 26 },
        { category: '技能特长', question_text: '您最自豪的技能或特长是什么？', order_index: 27 },
        { category: '失败教训', question_text: '您最大的失败是什么？从中学到了什么？', order_index: 28 },
        { category: '友情深厚', question_text: '您最珍贵的友谊是什么？', order_index: 29 },
        { category: '文化传承', question_text: '您希望传承给下一代的家族传统是什么？', order_index: 30 },
        { category: '精神信仰', question_text: '您的精神支柱或信仰是什么？', order_index: 31 },
        { category: '艺术欣赏', question_text: '对您影响最大的书籍、电影或艺术作品是什么？', order_index: 32 },
        { category: '生活方式', question_text: '您理想的生活方式是什么样的？', order_index: 33 },
        { category: '社会变迁', question_text: '您见证了哪些重要的社会变化？', order_index: 34 },
        { category: '遗憾与和解', question_text: '您人生中最大的遗憾是什么？现在如何看待？', order_index: 35 },
        { category: '生命意义', question_text: '您认为生命的意义是什么？', order_index: 36 }
      ];
      
      const allQuestions = [...defaultQuestions, ...additionalQuestions.map(q => ({
        ...q,
        question_type: 'text',
        is_required: q.order_index <= 15
      }))];
      
      await Question.bulkCreate(allQuestions);
      console.log('✅ 默认问题初始化完成 (36个问题)');
    }
    
  } catch (error) {
    console.error('❌ 初始化默认数据失败:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Memoir,
  Question,
  Answer,
  Diary,
  Chapter,
  initDatabase
};
