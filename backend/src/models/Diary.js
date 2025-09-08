const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Diary = sequelize.define('Diary', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [1, 200],
      notEmpty: true
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '图片文件路径数组'
  },
  mood: {
    type: DataTypes.ENUM('happy', 'sad', 'excited', 'calm', 'angry', 'confused', 'grateful', 'nostalgic'),
    allowNull: true
  },
  weather: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签数组'
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  diary_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'diaries',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['diary_date']
    },
    {
      fields: ['mood']
    },
    {
      fields: ['is_private']
    }
  ]
});

module.exports = Diary;
