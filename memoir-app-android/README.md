# 岁月镜像 Android 应用

这是岁月镜像应用的 Android 版本，使用 Capacitor 将 Vue.js Web 应用转换为原生 Android 应用。

## 项目结构

```
memoir-app-android/
├── android/                 # Android 原生项目
│   ├── app/                 # 应用模块
│   │   ├── src/main/        # 主要源代码
│   │   │   ├── java/        # Java 代码
│   │   │   ├── res/         # 资源文件
│   │   │   └── assets/      # Web 资源
│   │   └── build.gradle     # 构建配置
│   ├── build.gradle         # 项目构建配置
│   └── gradle.properties    # Gradle 属性
├── build.sh                 # 构建脚本
└── README.md               # 说明文档
```

## 功能特性

- 📱 原生 Android 应用体验
- 🎤 语音录制功能
- 📷 图片上传功能
- 🤖 AI 聊天功能
- 📝 回忆录记录
- 🔐 用户认证系统

## 构建要求

### 系统要求
- Android Studio 4.0+
- Java 8+
- Android SDK API 21+

### 环境变量
确保设置了以下环境变量：
```bash
export ANDROID_HOME=/path/to/android/sdk
export ANDROID_SDK_ROOT=/path/to/android/sdk
```

## 构建步骤

### 1. 使用构建脚本（推荐）
```bash
cd memoir-app-android
chmod +x build.sh
./build.sh
```

### 2. 手动构建
```bash
cd android
./gradlew assembleDebug
```

### 3. 使用 Android Studio
1. 打开 Android Studio
2. 选择 "Open an existing project"
3. 选择 `memoir-app-android/android` 文件夹
4. 等待 Gradle 同步完成
5. 点击 "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)"

## 输出文件

构建完成后，APK 文件位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 安装和测试

### 在设备上安装
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 在模拟器中测试
1. 启动 Android 模拟器
2. 运行 `adb install` 命令安装 APK

## 权限说明

应用需要以下权限：
- `INTERNET`: 网络访问
- `RECORD_AUDIO`: 语音录制
- `WRITE_EXTERNAL_STORAGE`: 文件写入
- `READ_EXTERNAL_STORAGE`: 文件读取
- `CAMERA`: 相机访问
- `ACCESS_NETWORK_STATE`: 网络状态
- `ACCESS_WIFI_STATE`: WiFi 状态

## 配置说明

### API 配置
应用需要连接到后端服务器。默认配置：
- 开发环境: `http://localhost:3001`
- 生产环境: 需要修改 `assets/public/assets/apiConfig.*.js` 文件

### 网络配置
确保 Android 应用可以访问您的后端服务器：
1. 检查网络权限
2. 配置网络安全策略（如果需要 HTTPS）

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Android SDK 是否正确安装
   - 确保 Java 版本兼容
   - 清理项目：`./gradlew clean`

2. **网络连接问题**
   - 检查应用权限
   - 验证后端服务器地址
   - 检查防火墙设置

3. **权限问题**
   - 确保在 AndroidManifest.xml 中声明了所需权限
   - 在运行时请求用户授权

## 更新应用

当 Web 应用更新时，需要重新构建 Android 应用：

1. 在 `memoir-app` 目录运行 `npm run build:h5`
2. 运行 `npx cap sync android`
3. 重新构建 APK

## 联系支持

如有问题，请联系开发团队。
