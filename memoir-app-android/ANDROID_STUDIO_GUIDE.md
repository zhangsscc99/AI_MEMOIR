# 使用 Android Studio 构建 APK 指南

由于命令行构建遇到了一些依赖问题，我们推荐使用 Android Studio 来构建 APK。

## 步骤 1：打开 Android Studio

1. 启动 Android Studio
2. 选择 "Open an existing project"
3. 导航到 `memoir-app-android/android` 文件夹
4. 点击 "Open"

## 步骤 2：等待同步

- Android Studio 会自动检测项目并开始同步
- 等待 "Gradle sync finished" 消息出现
- 如果出现错误，点击 "Try Again" 或 "Sync Now"

## 步骤 3：构建 APK

### 方法一：使用菜单
1. 点击菜单 "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)"
2. 等待构建完成

### 方法二：使用工具栏
1. 点击工具栏上的 "Build" 按钮（锤子图标）
2. 等待构建完成

## 步骤 4：找到 APK 文件

构建完成后，APK 文件位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 步骤 5：安装到手机

### 方法一：使用 ADB
1. 确保手机已连接并启用 USB 调试
2. 在终端运行：
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 方法二：直接传输
1. 将 APK 文件复制到手机
2. 在手机上点击 APK 文件安装
3. 允许安装未知来源的应用

## 故障排除

### 如果同步失败
1. 检查网络连接
2. 点击 "File" -> "Invalidate Caches and Restart"
3. 重新打开项目

### 如果构建失败
1. 检查错误信息
2. 确保 Android SDK 已正确安装
3. 尝试清理项目：Build -> Clean Project

### 如果安装失败
1. 确保手机已启用 USB 调试
2. 检查手机存储空间
3. 确保 APK 文件完整

## 快速命令

如果您想尝试命令行构建：

```bash
cd memoir-app-android
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
cd android
./gradlew clean
./gradlew assembleDebug
```

## 成功标志

当您看到以下消息时，说明构建成功：
```
BUILD SUCCESSFUL in Xs
X actionable tasks: X executed
```

APK 文件将位于 `android/app/build/outputs/apk/debug/app-debug.apk`
