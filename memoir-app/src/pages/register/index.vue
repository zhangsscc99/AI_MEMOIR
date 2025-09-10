<template>
  <view class="container">
    <!-- 返回按钮 -->
    <view class="back-btn" @click="goBack">
      <text class="back-icon">←</text>
    </view>
    
    <view class="register-header">
      <view class="app-title">岁月镜像</view>
      <view class="app-subtitle">开始记录您的人生故事</view>
    </view>
    
    <view class="register-form">
      <view class="form-title">创建账号</view>
      
      <view class="input-group">
        <view class="input-container">
          <input 
            class="input-field" 
            type="text" 
            placeholder="请输入用户名" 
            :value="registerForm.username"
            @input="updateUsername"
            :class="{ 'error': errors.username }"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </view>
        <text v-if="errors.username" class="error-text">{{ errors.username }}</text>
      </view>
      
      <view class="input-group">
        <view class="input-container">
          <input 
            class="input-field" 
            type="email" 
            placeholder="请输入邮箱" 
            :value="registerForm.email"
            @input="updateEmail"
            :class="{ 'error': errors.email }"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </view>
        <text v-if="errors.email" class="error-text">{{ errors.email }}</text>
      </view>
      
      <view class="input-group">
        <view class="input-container">
          <input 
            class="input-field" 
            type="password" 
            placeholder="请输入密码" 
            :value="registerForm.password"
            @input="updatePassword"
            :class="{ 'error': errors.password }"
            autocomplete="new-password"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </view>
        <text v-if="errors.password" class="error-text">{{ errors.password }}</text>
      </view>
      
      <view class="input-group">
        <view class="input-container">
          <input 
            class="input-field" 
            type="password" 
            placeholder="请确认密码" 
            :value="registerForm.confirmPassword"
            @input="updateConfirmPassword"
            :class="{ 'error': errors.confirmPassword }"
            autocomplete="new-password"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />
        </view>
        <text v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</text>
      </view>
      
      <view class="btn-container">
        <button 
          class="register-btn" 
          @click="handleRegister"
          :disabled="isLoading"
        >
          {{ isLoading ? '注册中...' : '注册' }}
        </button>
      </view>
      
      <view class="form-footer">
        <text class="login-text">已有账号？</text>
        <text class="login-link" @click="goToLogin">立即登录</text>
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
  created() {
    // 在组件创建时确保数据为空
    this.errors = {};
    console.log('注册页面初始化，表单数据:', this.registerForm);
  },
  mounted() {
    // 确保错误状态清空
    this.errors = {};
    console.log('页面挂载完成，表单数据:', this.registerForm);
  },
  methods: {
    updateUsername(event) {
      this.registerForm.username = event.detail.value || event.target.value || '';
      this.errors.username = '';  // 清除错误
    },
    
    updateEmail(event) {
      this.registerForm.email = event.detail.value || event.target.value || '';
      this.errors.email = '';  // 清除错误
    },
    
    updatePassword(event) {
      this.registerForm.password = event.detail.value || event.target.value || '';
      this.errors.password = '';  // 清除错误
    },
    
    updateConfirmPassword(event) {
      this.registerForm.confirmPassword = event.detail.value || event.target.value || '';
      this.errors.confirmPassword = '';  // 清除错误
    },
    
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
          url: apiUrl('/auth/register'),
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
        
        console.log('注册响应:', response);
        
        const data = response.data;
        
        if (response.statusCode === 200 || response.statusCode === 201) {
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
        } else if (response.statusCode === 400) {
          // 处理400错误（验证失败或用户已存在）
          throw new Error(data.message || '请求数据有误');
        } else {
          throw new Error('网络请求失败');
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

.register-header {
  background: white;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  margin-top: 60px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

@media (max-width: 375px) {
  .register-header {
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

.register-form {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

@media (max-width: 375px) {
  .register-form {
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

.register-btn {
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

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.register-btn:not(:disabled):active {
  transform: translateY(0px);
  background: rgba(255, 255, 255, 0.7);
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
