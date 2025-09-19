<template>
  <view class="container">
    <!-- 返回按钮 -->
    <view class="back-btn" @click="goBack">
      <text class="back-icon">←</text>
    </view>
    
    <view class="login-header">
      <view class="app-title">岁月镜像</view>
      <view class="app-subtitle">记录生命中的每一个珍贵瞬间</view>
    </view>
    
    <view class="login-form">
      <view class="form-title">欢迎回来</view>
      
      <view class="input-group">
        <view class="input-container">
          <input 
            class="input-field" 
            type="text" 
            placeholder="请输入用户名或邮箱" 
            :value="loginForm.identifier"
            @input="updateIdentifier"
            :class="{ 'error': errors.identifier }"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </view>
        <text v-if="errors.identifier" class="error-text">{{ errors.identifier }}</text>
      </view>
      
      <view class="input-group">
        <view class="input-container">
          <input 
            class="input-field" 
            type="password" 
            placeholder="请输入密码" 
            :value="loginForm.password"
            @input="updatePassword"
            :class="{ 'error': errors.password }"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </view>
        <text v-if="errors.password" class="error-text">{{ errors.password }}</text>
      </view>
      
      <view class="btn-container">
        <button 
          class="login-btn" 
          @click="handleLogin"
          :disabled="isLoading"
        >
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </view>
      
      <view class="form-footer">
        <text class="register-text">还没有账号？</text>
        <text class="register-link" @click="goToRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script>
// 导入 API 配置工具
import { apiUrl } from '@/utils/apiConfig.js';

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
  mounted() {
    // 确保错误状态清空
    this.errors = {};
  },
  methods: {
    updateIdentifier(event) {
      this.loginForm.identifier = event.detail.value || event.target.value || '';
      this.errors.identifier = '';
    },
    
    updatePassword(event) {
      this.loginForm.password = event.detail.value || event.target.value || '';
      this.errors.password = '';
    },
    
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
        const loginUrl = apiUrl('/auth/login');
        console.log('🔐 [Login] 准备发送登录请求...');
        console.log('🌐 [Login] 请求 URL:', loginUrl);
        console.log('📱 [Login] 当前环境检测:', {
          isCapacitor: !!window.Capacitor,
          userAgent: navigator.userAgent,
          location: window.location.href
        });
        
        const response = await uni.request({
          url: loginUrl,
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            identifier: this.loginForm.identifier.trim(),
            password: this.loginForm.password
          }
        });
        
        console.log('登录响应:', response);
        
        const data = response.data;
        
        if (response.statusCode === 200 || response.statusCode === 201) {
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
        } else if (response.statusCode === 400 || response.statusCode === 401) {
          throw new Error(data.message || '用户名或密码错误');
        } else {
          throw new Error('网络请求失败');
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
    },
    
    goBack() {
      uni.switchTab({
        url: '/pages/profile/index'
      });
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20px 12px;
  position: relative;
}

@media (max-width: 375px) {
  .container {
    padding: 15px 8px;
  }
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

@media (max-width: 375px) {
  .back-btn {
    top: 15px;
    left: 15px;
    width: 36px;
    height: 36px;
  }
}

.back-btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.back-btn:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.8);
}

.back-icon {
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.login-header {
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  margin-top: 60px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

@media (max-width: 375px) {
  .login-header {
    padding: 30px 15px;
    margin-top: 50px;
    border-radius: 8px;
  }
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.app-subtitle {
  font-size: 16px;
  color: #666;
  font-weight: 300;
}

.login-form {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

@media (max-width: 375px) {
  .login-form {
    padding: 25px 15px;
    border-radius: 8px;
  }
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

.input-container {
  display: flex;
  justify-content: center;
}

.input-field {
  width: calc(100% - 32px);
  max-width: 280px;
  height: 44px;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 0 16px;
  margin: 0 auto;
  font-size: 16px;
  color: #333;
  background: white;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.input-field:focus {
  border-color: #FF6B47;
  outline: none;
  background: white;
  box-shadow: 0 0 0 2px rgba(255, 107, 71, 0.1);
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

.btn-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.login-btn {
  width: calc(100% - 32px);
  max-width: 280px;
  height: 45px;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  backdrop-filter: blur(15px);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.login-btn:not(:disabled):active {
  transform: translateY(0px);
  background: rgba(255, 255, 255, 0.7);
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
