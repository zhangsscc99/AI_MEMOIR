<template>
  <view class="container">
    <view class="register-header">
      <view class="app-title">岁月镜像</view>
      <view class="app-subtitle">开始记录您的人生故事</view>
    </view>
    
    <view class="register-form">
      <view class="form-title">创建账号</view>
      
      <view class="input-group">
        <input 
          class="input-field" 
          type="text" 
          placeholder="请输入用户名" 
          v-model="registerForm.username"
          :class="{ 'error': errors.username }"
        />
        <text v-if="errors.username" class="error-text">{{ errors.username }}</text>
      </view>
      
      <view class="input-group">
        <input 
          class="input-field" 
          type="email" 
          placeholder="请输入邮箱" 
          v-model="registerForm.email"
          :class="{ 'error': errors.email }"
        />
        <text v-if="errors.email" class="error-text">{{ errors.email }}</text>
      </view>
      
      <view class="input-group">
        <input 
          class="input-field" 
          type="password" 
          placeholder="请输入密码" 
          v-model="registerForm.password"
          :class="{ 'error': errors.password }"
        />
        <text v-if="errors.password" class="error-text">{{ errors.password }}</text>
      </view>
      
      <view class="input-group">
        <input 
          class="input-field" 
          type="password" 
          placeholder="请确认密码" 
          v-model="registerForm.confirmPassword"
          :class="{ 'error': errors.confirmPassword }"
        />
        <text v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</text>
      </view>
      
      <button 
        class="register-btn" 
        @click="handleRegister"
        :disabled="isLoading"
      >
        {{ isLoading ? '注册中...' : '注册' }}
      </button>
      
      <view class="form-footer">
        <text class="login-text">已有账号？</text>
        <text class="login-link" @click="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      errors: {},
      isLoading: false
    }
  },
  methods: {
    validateForm() {
      this.errors = {};
      
      // 验证用户名
      if (!this.registerForm.username.trim()) {
        this.errors.username = '请输入用户名';
      } else if (this.registerForm.username.length < 3) {
        this.errors.username = '用户名至少需要3个字符';
      } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(this.registerForm.username)) {
        this.errors.username = '用户名只能包含字母、数字、下划线和中文';
      }
      
      // 验证邮箱
      if (!this.registerForm.email.trim()) {
        this.errors.email = '请输入邮箱';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.registerForm.email)) {
        this.errors.email = '请输入有效的邮箱地址';
      }
      
      // 验证密码
      if (!this.registerForm.password) {
        this.errors.password = '请输入密码';
      } else if (this.registerForm.password.length < 6) {
        this.errors.password = '密码至少需要6个字符';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.registerForm.password)) {
        this.errors.password = '密码必须包含大小写字母和数字';
      }
      
      // 验证确认密码
      if (!this.registerForm.confirmPassword) {
        this.errors.confirmPassword = '请确认密码';
      } else if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.errors.confirmPassword = '两次输入的密码不一致';
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    async handleRegister() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        const response = await uni.request({
          url: 'http://localhost:3001/api/auth/register',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            username: this.registerForm.username.trim(),
            email: this.registerForm.email.trim(),
            password: this.registerForm.password,
            confirmPassword: this.registerForm.confirmPassword
          }
        });
        
        const [error, result] = response;
        
        if (error) {
          throw new Error('网络请求失败');
        }
        
        const { data } = result;
        
        if (data.success) {
          // 保存用户信息和token
          uni.setStorageSync('token', data.data.token);
          uni.setStorageSync('user', data.data.user);
          
          uni.showToast({
            title: '注册成功',
            icon: 'success'
          });
          
          // 跳转到个人空间页面
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/profile/index'
            });
          }, 1500);
          
        } else {
          throw new Error(data.message || '注册失败');
        }
        
      } catch (error) {
        console.error('注册失败:', error);
        uni.showToast({
          title: error.message || '注册失败，请重试',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    goToLogin() {
      uni.navigateBack();
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.register-header {
  text-align: center;
  margin-bottom: 40px;
}

.app-title {
  font-size: 36px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;
  letter-spacing: 2px;
}

.app-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
}

.register-form {
  width: 100%;
  max-width: 360px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-field {
  width: 100%;
  height: 50px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
  color: #333;
  background: white;
  transition: all 0.3s ease;
}

.input-field:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-field.error {
  border-color: #ff4757;
}

.error-text {
  font-size: 14px;
  color: #ff4757;
  margin-top: 6px;
  display: block;
}

.register-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-btn:not(:disabled):active {
  transform: translateY(1px);
}

.form-footer {
  text-align: center;
  margin-top: 30px;
}

.login-text {
  font-size: 14px;
  color: #666;
}

.login-link {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
  margin-left: 8px;
}

.login-link:active {
  opacity: 0.7;
}
</style>
