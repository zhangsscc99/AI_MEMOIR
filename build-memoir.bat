@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 岁月镜像 Memoir APK 构建脚本 (Windows版本)
echo.
echo ================================
echo 🚀 岁月镜像 Memoir APK 构建工具
echo ================================
echo.

:: 设置项目路径 (请根据实际情况修改)
set "PROJECT_ROOT=%~dp0"
set "MEMOIR_APP_DIR=%PROJECT_ROOT%memoir-app"
set "ANDROID_DIR=%MEMOIR_APP_DIR%\android"

echo 📋 项目路径: %PROJECT_ROOT%
echo.

:: 检查Node.js
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: npm 未找到，请安装 Node.js
    pause
    exit /b 1
)

:: 检查Java
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: Java 未找到，请安装 Java JDK
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

:: 步骤1: 构建Web应用
echo ================================
echo 📦 步骤1: 构建Web应用
echo ================================
cd /d "%MEMOIR_APP_DIR%"
echo 🔨 正在构建Web应用...
call npm run build:h5
if %errorlevel% neq 0 (
    echo ❌ Web应用构建失败
    pause
    exit /b 1
)
echo ✅ Web应用构建成功
echo.

:: 步骤2: 同步到Android
echo ================================
echo 🔄 步骤2: 同步到Android平台
echo ================================
echo 🔄 正在同步Web资源到Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ❌ Android同步失败
    pause
    exit /b 1
)
echo ✅ Android同步成功
echo.

:: 步骤3: 构建APK
echo ================================
echo 📱 步骤3: 构建Android APK
echo ================================
cd /d "%ANDROID_DIR%"
echo 🔨 正在构建APK文件...
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo ❌ APK构建失败
    pause
    exit /b 1
)
echo ✅ APK构建成功
echo.

:: 验证APK文件
set "APK_FILE=%ANDROID_DIR%\app\build\outputs\apk\debug\memoir.apk"
if exist "%APK_FILE%" (
    echo ================================
    echo 🎉 构建完成！
    echo ================================
    echo 📱 APK文件: %APK_FILE%
    for %%A in ("%APK_FILE%") do echo 📦 文件大小: %%~zA 字节
    echo.
    echo 📲 安装到手机: adb install "%APK_FILE%"
    echo.
) else (
    echo ❌ 错误: APK文件未找到
    pause
    exit /b 1
)

echo ✨ 构建流程完成
pause
