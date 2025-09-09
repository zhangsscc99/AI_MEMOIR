const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Chapter = sequelize.define('Chapter', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  chapter_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isValidChapterId(value) {
        const validChapterIds = ['background', 'childhood', 'education', 'career', 'love', 'family', 'travel', 'relationships', 'laterlife', 'wisdom'];
        const isCustomDiary = value.startsWith('diary_');
        
        if (!validChapterIds.includes(value) && !isCustomDiary) {
          throw new Error('无效的章节ID');
        }
      }
    }
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recordings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('draft', 'in_progress', 'completed'),
    defaultValue: 'draft',
    allowNull: false
  },
  word_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  recording_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  background_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '章节背景图片路径'
  }
}, {
  tableName: 'chapters',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['chapter_id']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['user_id', 'chapter_id']
    }
  ]
});

// 实例方法：更新章节状态
Chapter.prototype.updateStatus = async function() {
  const hasContent = this.content && this.content.trim().length > 0;
  const hasRecordings = this.recordings && this.recordings.length > 0;
  
  if (hasContent || hasRecordings) {
    if (this.status === 'draft') {
      this.status = 'in_progress';
    }
    
    // 计算字数
    this.word_count = this.content ? this.content.length : 0;
    this.recording_count = this.recordings ? this.recordings.length : 0;
    
    // 判断是否完成（有内容且字数超过100字，或有录音）
    if ((this.word_count >= 100) || (this.recording_count > 0)) {
      this.status = 'completed';
    }
  }
  
  await this.save();
};

module.exports = Chapter;
