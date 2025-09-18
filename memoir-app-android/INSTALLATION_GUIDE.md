# 岁月镜像 Android 应用安装指南

## 前置要求

### 1. 安装 Android Studio
- 下载并安装 [Android Studio](https://developer.android.com/studio)
- 安装时选择 "Standard" 安装类型
- 确保安装了 Android SDK

### 2. 设置环境变量

#### macOS/Linux:
```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### Windows:
```cmd
# 添加到系统环境变量
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\YourUsername\AppData\Local\Android\Sdk
```

### 3. 安装 Java
- 确保安装了 Java 8 或更高版本
- 可以通过 Android Studio 自动安装

## 构建步骤

### 方法一：使用构建脚本（推荐）

1. **检查 Android SDK 路径**
   ```bash
   # 编辑 local.properties 文件
   nano memoir-app-android/android/local.properties
   ```
   
   确保 `sdk.dir` 指向正确的 Android SDK 路径

2. **运行构建脚本**
   ```bash
   cd memoir-app-android
   ./build.sh
   ```

### 方法二：使用 Android Studio

1. **打开项目**
   - 启动 Android Studio
   - 选择 "Open an existing project"
   - 选择 `memoir-app-android/android` 文件夹

2. **等待同步**
   - Android Studio 会自动同步 Gradle
   - 等待 "Gradle sync finished" 消息

3. **构建 APK**
   - 点击菜单 "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)"
   - 或者点击工具栏上的 "Build" 按钮

### 方法三：命令行构建

```bash
cd memoir-app-android/android
./gradlew assembleDebug
```

## 安装 APK

### 在 Android 设备上安装

1. **启用开发者选项**
   - 进入 "设置" -> "关于手机"
   - 连续点击 "版本号" 7次
   - 返回设置，找到 "开发者选项"

2. **启用 USB 调试**
   - 在开发者选项中启用 "USB 调试"

3. **连接设备并安装**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 在模拟器中安装

1. **启动 Android 模拟器**
   ```bash
   # 列出可用模拟器
   emulator -list-avds
   
   # 启动模拟器
   emulator -avd YourAVDName
   ```

2. **安装 APK**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

## 故障排除

### 常见问题

1. **"SDK location not found" 错误**
   - 检查 `local.properties` 文件中的 `sdk.dir` 路径
   - 确保 Android SDK 已正确安装

2. **"Command not found: adb" 错误**
   - 确保 Android SDK platform-tools 在 PATH 中
   - 重新安装 Android SDK

3. **构建失败**
   - 清理项目：`./gradlew clean`
   - 重新构建：`./gradlew assembleDebug`

4. **权限问题**
   - 确保应用有必要的权限
   - 在设备上手动授予权限

### 获取帮助

如果遇到问题：
1. 检查 Android Studio 的 "Build" 输出窗口
2. 查看 Gradle 构建日志
3. 确保所有依赖都已正确安装

## 更新应用

当 Web 应用更新时：

1. **更新 Web 资源**
   ```bash
   cd memoir-app-android
   ./update-web-assets.sh
   ```

2. **重新构建**
   ```bash
   ./build.sh
   ```

## 发布应用

### 生成签名 APK

1. **创建密钥库**
   ```bash
   keytool -genkey -v -keystore memoir-release-key.keystore -alias memoir -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **配置签名**
   - 在 `android/app/build.gradle` 中添加签名配置

3. **构建发布版本**
   ```bash
   ./gradlew assembleRelease
   ```

### 上传到应用商店

- Google Play Store
- 华为应用市场
- 小米应用商店
- 其他第三方应用商店
