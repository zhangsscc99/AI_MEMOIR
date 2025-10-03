# 🍎 命令行运行iOS应用指南

## 🚀 快速开始

### 方法1: 使用快速运行脚本 (最简单)

```bash
# 快速运行iOS应用
./quick-run-ios.sh
```

### 方法2: 使用完整运行脚本 (推荐)

```bash
# 显示菜单选择运行方式
./run-ios.sh

# 或快速运行模式
./run-ios.sh --quick
```

### 方法3: 使用Capacitor CLI

```bash
cd memoir-app
npx cap run ios
```

### 方法4: 使用xcodebuild

```bash
cd memoir-app/ios/App
xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,name=iPhone 15" build install
```

## 📱 前提条件

### 1. 安装Xcode
```bash
# 从App Store安装Xcode
# 或从Apple Developer网站下载
```

### 2. 配置iOS模拟器
1. 打开Xcode
2. 选择 `Window` → `Devices and Simulators`
3. 点击 `+` 添加新的模拟器
4. 选择iPhone型号和iOS版本

### 3. 安装CocoaPods (已完成)
```bash
brew install cocoapods
```

## 🔧 详细步骤

### 步骤1: 检查模拟器状态
```bash
# 列出所有可用的模拟器
xcrun simctl list devices available

# 列出所有设备类型
xcrun simctl list devicetypes | grep iPhone
```

### 步骤2: 创建模拟器 (如果需要)
```bash
# 创建iPhone 15模拟器
xcrun simctl create "iPhone 15" "iPhone 15" "iOS-17-0"
```

### 步骤3: 启动模拟器
```bash
# 启动模拟器
xcrun simctl boot "iPhone 15"
open -a Simulator
```

### 步骤4: 构建并运行应用
```bash
cd memoir-app/ios/App
xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,name=iPhone 15" build install
```

## 🎯 一键运行命令

### 最简单的命令
```bash
# 进入项目目录
cd /Users/Zhuanz1/Desktop/memoir

# 运行快速脚本
./quick-run-ios.sh
```

### 使用Capacitor CLI
```bash
cd memoir-app
npx cap run ios --target="iPhone 15"
```

### 使用xcodebuild
```bash
cd memoir-app/ios/App
xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,name=iPhone 15" build install
```

## 🐛 故障排除

### 问题1: "No simulators available"
**解决方案:**
```bash
# 打开Xcode配置模拟器
open -a Xcode
# 然后选择 Window → Devices and Simulators
```

### 问题2: "Unable to retrieve simulator list"
**解决方案:**
```bash
# 重置模拟器
xcrun simctl shutdown all
xcrun simctl erase all
```

### 问题3: "Build failed"
**解决方案:**
```bash
# 清理项目
cd memoir-app/ios/App
pod deintegrate
pod install
xcodebuild clean -workspace App.xcworkspace -scheme App
```

### 问题4: "Command not found: xcodebuild"
**解决方案:**
```bash
# 安装Xcode Command Line Tools
xcode-select --install
```

## 📋 常用命令总结

```bash
# 1. 快速运行 (推荐)
./quick-run-ios.sh

# 2. 完整运行脚本
./run-ios.sh

# 3. 使用Capacitor CLI
cd memoir-app && npx cap run ios

# 4. 直接使用xcodebuild
cd memoir-app/ios/App && xcodebuild -workspace App.xcworkspace -scheme App -destination "platform=iOS Simulator,name=iPhone 15" build install

# 5. 打开Xcode项目
open memoir-app/ios/App/App.xcworkspace

# 6. 检查模拟器
xcrun simctl list devices available

# 7. 启动模拟器
xcrun simctl boot "iPhone 15" && open -a Simulator
```

## 🎉 成功标志

当看到以下信息时，说明应用运行成功：
- ✅ "应用已成功运行到iOS模拟器"
- ✅ 模拟器自动打开
- ✅ 应用出现在模拟器屏幕上

## 💡 提示

1. **首次运行**: 建议先打开Xcode配置模拟器
2. **性能优化**: 使用较新的iPhone型号模拟器
3. **调试**: 在Xcode中可以看到详细的构建日志
4. **真机测试**: 连接iPhone后可以在真机上运行

现在你可以通过命令行直接运行iOS应用了！🍎✨
