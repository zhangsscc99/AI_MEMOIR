const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true
    }
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    validate: {
      is: /^[0-9+\-\s()]*$/
    }
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
    defaultValue: null
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  is_vip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  vip_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  login_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_vip']
    }
  ],
  hooks: {
    // 保存前自动加密密码
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// 实例方法：获取用户公开信息
User.prototype.getPublicProfile = function() {
  const { password, ...publicData } = this.toJSON();
  return publicData;
};

// 实例方法：更新登录信息
User.prototype.updateLoginInfo = async function() {
  this.last_login_at = new Date();
  this.login_count += 1;
  await this.save();
};

// 类方法：根据邮箱或用户名查找用户
User.findByEmailOrUsername = async function(identifier) {
  return await this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { email: identifier },
        { username: identifier }
      ]
    }
  });
};

module.exports = User;
