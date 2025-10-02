# 📱 Memoir APK 构建指南

## 🚀 一键构建脚本

我们提供了多个构建脚本来帮助你轻松构建memoir.apk文件：

### 1. 完整版构建脚本 (推荐)

```bash
./build-memoir.sh
```

**特性:**
- ✅ 彩色输出和进度显示
- ✅ 环境检查和错误处理
- ✅ 交互式选项（清理旧文件、复制到桌面）
- ✅ 详细的构建日志
- ✅ 自动验证构建结果

### 2. 快速构建脚本

```bash
./quick-build.sh
```

**特性:**
- ✅ 无交互式操作
- ✅ 快速构建流程
- ✅ 适合自动化脚本

### 3. Windows 批处理脚本

```cmd
build-memoir.bat
```

**特性:**
- ✅ Windows 系统支持
- ✅ 中文界面
- ✅ 错误处理

## 📋 构建流程

所有脚本都执行以下标准流程：

1. **环境检查** - 验证Node.js、Java等必要工具
2. **构建Web应用** - `npm run build:h5`
3. **同步Android** - `npx cap sync android`
4. **构建APK** - `./gradlew assembleDebug`
5. **验证结果** - 检查APK文件是否生成成功

## 🎯 输出结果

构建成功后，APK文件位于：
```
memoir-app/android/app/build/outputs/apk/debug/memoir.apk
```

## 📲 安装APK

### 方法1: 使用ADB
```bash
adb install memoir-app/android/app/build/outputs/apk/debug/memoir.apk
```

### 方法2: 直接传输
1. 将APK文件复制到手机
2. 在手机上点击APK文件安装
3. 允许安装未知来源的应用

## 🔧 环境要求

### 必需工具
- **Node.js** (v14+) 和 npm
- **Java JDK** (v8+)
- **Android SDK** (通过Android Studio安装)

### 环境变量
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
```

## 🐛 故障排除

### 常见问题

1. **"npm command not found"**
   - 安装Node.js: https://nodejs.org/

2. **"java command not found"**
   - 安装Java JDK
   - 设置JAVA_HOME环境变量

3. **"gradlew: Permission denied"**
   ```bash
   chmod +x memoir-app/android/gradlew
   ```

4. **"SDK location not found"**
   - 检查Android SDK安装
   - 设置ANDROID_HOME环境变量

5. **构建失败**
   ```bash
   # 清理项目
   cd memoir-app/android
   ./gradlew clean
   
   # 重新构建
   ./gradlew assembleDebug
   ```

## 📝 自定义配置

### 修改APK名称
编辑 `memoir-app/android/app/build.gradle`:
```gradle
android.applicationVariants.all { variant ->
    variant.outputs.all {
        outputFileName = "your-app-name.apk"
    }
}
```

### 修改应用信息
编辑 `memoir-app/capacitor.config.json`:
```json
{
  "appId": "com.yourcompany.app",
  "appName": "Your App Name"
}
```

## 🔄 更新流程

当Web应用更新时：
1. 运行构建脚本重新生成APK
2. 卸载旧版本应用
3. 安装新的APK文件

## 📞 获取帮助

如果遇到问题：
1. 检查构建日志中的错误信息
2. 确保所有依赖都已正确安装
3. 尝试清理项目后重新构建

## 🎉 快速开始

```bash
# 克隆项目后，直接运行：
cd memoir
./build-memoir.sh

# 或者快速构建：
./quick-build.sh
```

就这么简单！🚀
