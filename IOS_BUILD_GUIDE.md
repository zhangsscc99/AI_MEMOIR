# 🍎 Memoir iOS 应用构建指南

## 🚀 一键构建脚本

我们提供了多个构建脚本来帮助你轻松构建iOS应用：

### 1. 完整版构建脚本 (推荐)

```bash
./build-ios.sh
```

**特性:**
- ✅ 彩色输出和进度显示
- ✅ 环境检查和错误处理
- ✅ 自动检测iOS模拟器
- ✅ 交互式选项（安装到模拟器、打开Xcode）
- ✅ 详细的构建日志

### 2. 快速构建脚本

```bash
./quick-build-ios.sh
```

**特性:**
- ✅ 无交互式操作
- ✅ 快速构建流程
- ✅ 适合自动化脚本

## 📋 构建流程

所有脚本都执行以下标准流程：

1. **环境检查** - 验证Node.js、Xcode、CocoaPods等必要工具
2. **构建Web应用** - `npm run build:h5`
3. **同步iOS** - `npx cap sync ios`
4. **安装依赖** - `pod install`
5. **构建iOS应用** - `xcodebuild -workspace App.xcworkspace -scheme App build`

## 🎯 输出结果

构建成功后，iOS项目位于：
```
memoir-app/ios/App/App.xcworkspace
```

## 📱 运行iOS应用

### 方法1: 使用Xcode (推荐)
```bash
# 打开Xcode项目
open /Users/Zhuanz1/Desktop/memoir/memoir-app/ios/App/App.xcworkspace
```

在Xcode中：
1. 选择目标设备或模拟器
2. 点击运行按钮 (▶️) 或按 `Cmd+R`
3. 等待应用构建并运行

### 方法2: 命令行运行
```bash
# 列出可用模拟器
xcrun simctl list devices available

# 运行到指定模拟器
xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,name=iPhone 15" build
```

## 🔧 环境要求

### 必需工具
- **Node.js** (v14+) 和 npm
- **Xcode** (最新版本)
- **CocoaPods** - iOS依赖管理工具
- **macOS** - iOS开发只能在macOS上进行

### 安装CocoaPods
```bash
# 使用Homebrew安装
brew install cocoapods

# 或使用gem安装
sudo gem install cocoapods
```

### 环境变量
确保Xcode Command Line Tools已安装：
```bash
xcode-select --install
```

## 📱 设备配置

### iOS模拟器
1. 打开Xcode
2. 选择 `Window` → `Devices and Simulators`
3. 点击 `+` 添加新的模拟器
4. 选择iPhone型号和iOS版本

### 真机设备
1. 连接iPhone到Mac
2. 在iPhone上信任此电脑
3. 在Xcode中选择你的设备
4. 配置开发者账号和证书

## 🐛 故障排除

### 常见问题

1. **"pod command not found"**
   ```bash
   # 安装CocoaPods
   brew install cocoapods
   ```

2. **"xcodebuild command not found"**
   ```bash
   # 安装Xcode Command Line Tools
   xcode-select --install
   ```

3. **"No such file or directory: App.xcworkspace"**
   ```bash
   # 确保在正确的目录
   cd memoir-app/ios/App
   ```

4. **构建失败**
   ```bash
   # 清理项目
   cd memoir-app/ios/App
   pod deintegrate
   pod install
   ```

5. **模拟器问题**
   ```bash
   # 重置模拟器
   xcrun simctl erase all
   ```

## 📝 自定义配置

### 修改应用信息
编辑 `memoir-app/ios/App/App/Info.plist`:
```xml
<key>CFBundleDisplayName</key>
<string>你的应用名称</string>
```

### 修改包标识符
编辑 `memoir-app/ios/App/App.xcodeproj/project.pbxproj`:
```
PRODUCT_BUNDLE_IDENTIFIER = com.yourcompany.yourapp;
```

### 添加权限
编辑 `memoir-app/ios/App/App/Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>此应用需要访问麦克风来录制语音</string>
<key>NSCameraUsageDescription</key>
<string>此应用需要访问相机来拍照</string>
```

## 🔄 更新流程

当Web应用更新时：
1. 运行构建脚本重新生成iOS应用
2. 在Xcode中重新构建和运行

## 📦 发布应用

### 开发版本
1. 在Xcode中选择 `Product` → `Build`
2. 选择目标设备运行

### 测试版本 (TestFlight)
1. 在Xcode中选择 `Product` → `Archive`
2. 上传到App Store Connect
3. 配置TestFlight测试

### 正式版本
1. 配置App Store Connect
2. 提交审核
3. 发布到App Store

## 🎉 快速开始

```bash
# 克隆项目后，直接运行：
cd memoir
./build-ios.sh

# 或者快速构建：
./quick-build-ios.sh

# 打开Xcode：
open memoir-app/ios/App/App.xcworkspace
```

## 📞 获取帮助

如果遇到问题：
1. 检查Xcode版本是否最新
2. 确保CocoaPods已正确安装
3. 查看Xcode构建日志中的错误信息
4. 参考Capacitor官方文档

## 🆚 Android vs iOS

| 特性 | Android | iOS |
|------|---------|-----|
| 构建工具 | Gradle | Xcode |
| 依赖管理 | Gradle | CocoaPods |
| 输出文件 | APK | .app |
| 开发环境 | 跨平台 | macOS only |
| 发布方式 | APK/Play Store | App Store |

现在你可以在iOS设备上运行memoir应用了！🍎✨
