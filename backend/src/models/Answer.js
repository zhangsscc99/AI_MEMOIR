const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Answer = sequelize.define('Answer', {
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
  memoir_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'memoirs',
      key: 'id'
    }
  },
  question_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'questions',
      key: 'id'
    }
  },
  answer_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  answer_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '复杂答案数据，如文件路径、选择项等'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '附件文件路径数组'
  },
  is_complete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  answered_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'answers',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['memoir_id']
    },
    {
      fields: ['question_id']
    },
    {
      unique: true,
      fields: ['memoir_id', 'question_id'],
      name: 'unique_memoir_question'
    }
  ]
});

// 实例方法：标记为已完成
Answer.prototype.markAsComplete = async function() {
  this.is_complete = true;
  this.answered_at = new Date();
  await this.save();
};

module.exports = Answer;
