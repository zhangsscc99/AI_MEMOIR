<template>
  <view class="container">
    <view class="login-header">
      <view class="app-title">岁月镜像</view>
      <view class="app-subtitle">记录生命中的每一个珍贵瞬间</view>
    </view>
    
    <view class="login-form">
      <view class="form-title">欢迎回来</view>
      
      <view class="input-group">
        <input 
          class="input-field" 
          type="text" 
          placeholder="请输入用户名或邮箱" 
          v-model="loginForm.identifier"
          :class="{ 'error': errors.identifier }"
        />
        <text v-if="errors.identifier" class="error-text">{{ errors.identifier }}</text>
      </view>
      
      <view class="input-group">
        <input 
          class="input-field" 
          type="password" 
          placeholder="请输入密码" 
          v-model="loginForm.password"
          :class="{ 'error': errors.password }"
        />
        <text v-if="errors.password" class="error-text">{{ errors.password }}</text>
      </view>
      
      <button 
        class="login-btn" 
        @click="handleLogin"
        :disabled="isLoading"
      >
        {{ isLoading ? '登录中...' : '登录' }}
      </button>
      
      <view class="form-footer">
        <text class="register-text">还没有账号？</text>
        <text class="register-link" @click="goToRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loginForm: {
        identifier: '',
        password: ''
      },
      errors: {},
      isLoading: false
    }
  },
  methods: {
    validateForm() {
      this.errors = {};
      
      if (!this.loginForm.identifier.trim()) {
        this.errors.identifier = '请输入用户名或邮箱';
      }
      
      if (!this.loginForm.password.trim()) {
        this.errors.password = '请输入密码';
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    async handleLogin() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        const response = await uni.request({
          url: 'http://localhost:3001/api/auth/login',
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            identifier: this.loginForm.identifier.trim(),
            password: this.loginForm.password
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
            title: '登录成功',
            icon: 'success'
          });
          
          // 跳转到个人空间页面
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/profile/index'
            });
          }, 1500);
          
        } else {
          throw new Error(data.message || '登录失败');
        }
        
      } catch (error) {
        console.error('登录失败:', error);
        uni.showToast({
          title: error.message || '登录失败，请重试',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/index'
      });
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

.login-header {
  text-align: center;
  margin-bottom: 60px;
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

.login-form {
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

.login-btn {
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

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn:not(:disabled):active {
  transform: translateY(1px);
}

.form-footer {
  text-align: center;
  margin-top: 30px;
}

.register-text {
  font-size: 14px;
  color: #666;
}

.register-link {
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
  margin-left: 8px;
}

.register-link:active {
  opacity: 0.7;
}
</style>
