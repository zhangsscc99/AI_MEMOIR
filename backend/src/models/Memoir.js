const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Memoir = sequelize.define('Memoir', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'in_progress', 'completed', 'published'),
    defaultValue: 'draft',
    allowNull: false
  },
  total_questions: {
    type: DataTypes.INTEGER,
    defaultValue: 36,
    allowNull: false
  },
  answered_questions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  progress_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'memoirs',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_public']
    }
  ]
});

// 实例方法：更新进度
Memoir.prototype.updateProgress = async function() {
  if (this.total_questions > 0) {
    this.progress_percentage = (this.answered_questions / this.total_questions * 100).toFixed(2);
    
    if (this.answered_questions >= this.total_questions && this.status !== 'completed') {
      this.status = 'completed';
      this.completed_at = new Date();
    }
    
    await this.save();
  }
};

module.exports = Memoir;
