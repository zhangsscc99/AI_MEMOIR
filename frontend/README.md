# 岁月镜像 (EchoLens) - 前端项目

AI回忆录应用的前端部分，基于Vue 3 + UniApp开发，支持Web和微信小程序。

## 项目结构

```
frontend/
├── pages/                 # 页面文件
│   ├── index/            # 首页
│   ├── memoir/           # 回忆录页面  
│   ├── diary/            # 随记页面
│   ├── profile/          # 我的页面
│   ├── welcome/          # 欢迎页面
│   └── question/         # 问答页面
├── static/               # 静态资源
│   ├── tabbar/          # 底部导航图标
│   ├── images/          # 图片资源
│   └── icons/           # 图标资源
├── common/               # 公共资源
│   └── common.css       # 全局样式
├── App.vue              # 应用入口
├── main.js              # 主入口文件
├── pages.json           # 页面配置
├── manifest.json        # 应用配置
├── uni.scss            # 全局SCSS变量
└── vite.config.js      # Vite配置
```

## 主要功能

### 1. 首页 (index)
- 回忆录工坊卡片，显示录制进度
- 随记功能入口
- 章节预览区域

### 2. 回忆录页面 (memoir)
- 36个问题的问答流程
- 进度条显示
- AI头像交互

### 3. 随记页面 (diary)  
- 随记列表展示
- 新建随记功能
- 随记管理(编辑/删除)

### 4. 我的页面 (profile)
- 用户信息展示
- 功能菜单(购买、订单、客服等)
- 会员状态显示

### 5. 欢迎页面 (welcome)
- 回忆录工坊介绍
- 开启回忆之旅入口

### 6. 问答页面 (question)
- 详细的问答交互流程
- 单选/多选支持
- 答案保存和进度跟踪

## 技术特性

- **Vue 3** - 现代化的Vue框架
- **UniApp** - 跨平台开发框架
- **响应式设计** - 适配不同屏幕尺寸
- **组件化开发** - 可复用的UI组件
- **SCSS支持** - 更强大的样式预处理
- **微信小程序兼容** - 可直接编译为小程序

## 安装和运行

### 环境要求
- Node.js >= 16
- npm 或 yarn

### 安装依赖
```bash
cd frontend
npm install
```

### 开发运行
```bash
# Web端开发
npm run dev

# 微信小程序开发
npm run dev:mp-weixin
```

### 构建打包
```bash
# Web端构建
npm run build

# 微信小程序构建  
npm run build:mp-weixin
```

## 设计规范

### 色彩规范
- 主色调: #FF6B47 (橙红色)
- 辅助色: #FF8A65 (浅橙色) 
- 文字色: #333333 (深灰)
- 次要文字: #666666 (中灰)
- 提示文字: #999999 (浅灰)

### 组件规范
- 按钮圆角: 25px
- 卡片圆角: 12-16px
- 间距单位: 4px的倍数
- 阴影: 统一使用box-shadow

## 开发注意事项

1. **跨平台兼容**: 代码需要同时兼容Web和小程序
2. **图片资源**: 使用相对路径引用静态资源
3. **导航方式**: 使用uni.navigateTo和uni.switchTab
4. **数据存储**: 使用uni.getStorageSync/setStorageSync
5. **API调用**: 使用uni.request进行网络请求

## 后续开发计划

- [ ] 添加更多问答题目(完善到36个)
- [ ] 实现随记编辑功能
- [ ] 添加图片上传功能
- [ ] 集成AI生成回忆录功能
- [ ] 添加分享功能
- [ ] 优化动画效果
