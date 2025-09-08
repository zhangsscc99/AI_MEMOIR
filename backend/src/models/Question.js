const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  question_type: {
    type: DataTypes.ENUM('text', 'choice', 'date', 'number', 'file'),
    defaultValue: 'text',
    allowNull: false
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '选择题的选项'
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'questions',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['order_index']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Question;
