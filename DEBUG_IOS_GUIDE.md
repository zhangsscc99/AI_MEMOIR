# 🔍 iOS应用调试指南

## 🎯 调试方法对比

| 方法 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Safari Web Inspector | 功能完整，类似Chrome DevTools | 需要Safari | 日常开发调试 |
| Xcode控制台 | 原生集成，性能好 | 功能有限 | 查看系统日志 |
| Live Reload | 实时更新，开发效率高 | 需要网络连接 | 开发阶段 |
| Chrome DevTools | 熟悉的界面 | 需要额外配置 | 复杂调试 |

## 🔍 方法1: Safari Web Inspector (推荐)

### 启用步骤

1. **启用Safari开发者菜单**：
   ```
   Safari → 偏好设置 → 高级 → 勾选"在菜单栏中显示开发菜单"
   ```

2. **运行iOS应用**：
   ```bash
   cd memoir-app
   npx cap run ios --target="F72A1F19-EE9C-4977-9558-7FBE01D218AB"
   ```

3. **连接调试**：
   ```
   Safari → 开发 → iPhone 15 Simulator → localhost → Memoir
   ```

### 调试功能

- **Console**: 查看JavaScript错误和日志
- **Network**: 监控网络请求
- **Elements**: 检查DOM结构
- **Sources**: 设置断点和调试代码
- **Application**: 查看本地存储和缓存

## 🔍 方法2: Xcode控制台调试

### 使用步骤

1. **打开Xcode项目**：
   ```bash
   open memoir-app/ios/App/App.xcworkspace
   ```

2. **运行应用**：
   - 选择iPhone 15模拟器
   - 点击运行按钮 (▶️)

3. **查看控制台**：
   - 在Xcode底部查看控制台输出
   - 显示JavaScript错误和系统日志

## 🔍 方法3: Live Reload调试

### 使用调试脚本

```bash
# 运行调试脚本
./debug-ios.sh
```

### 手动启用Live Reload

```bash
cd memoir-app

# 启动开发服务器
npm run dev:h5 &

# 运行iOS应用 (Live Reload)
npx cap run ios --target="F72A1F19-EE9C-4977-9558-7FBE01D218AB" --live-reload --host="你的IP地址" --port=8080
```

### Live Reload优势

- ✅ 代码修改后自动刷新
- ✅ 无需重新构建应用
- ✅ 实时查看修改效果
- ✅ 保持应用状态

## 🔍 方法4: Chrome DevTools (高级)

### 配置步骤

1. **修改Capacitor配置**：
   ```json
   // capacitor.config.json
   {
     "server": {
       "url": "http://你的IP地址:8080",
       "cleartext": true
     }
   }
   ```

2. **启动开发服务器**：
   ```bash
   npm run dev:h5
   ```

3. **运行应用**：
   ```bash
   npx cap run ios --target="F72A1F19-EE9C-4977-9558-7FBE01D218AB"
   ```

4. **使用Chrome调试**：
   - 打开Chrome
   - 访问 `chrome://inspect`
   - 找到你的应用并点击"inspect"

## 🐛 常见调试场景

### 1. JavaScript错误

**Safari Web Inspector**:
```
Console → 查看红色错误信息
Sources → 设置断点调试
```

**Xcode控制台**:
```
底部控制台 → 查看错误日志
```

### 2. 网络请求问题

**Safari Web Inspector**:
```
Network → 查看请求状态
查看请求头和响应内容
```

### 3. 性能问题

**Safari Web Inspector**:
```
Timeline → 查看性能分析
Memory → 检查内存使用
```

### 4. 样式问题

**Safari Web Inspector**:
```
Elements → 检查DOM结构
Styles → 查看CSS样式
```

## 🚀 快速调试命令

### 一键调试脚本
```bash
./debug-ios.sh
```

### 手动调试命令
```bash
# 1. 运行应用
cd memoir-app
npx cap run ios --target="F72A1F19-EE9C-4977-9558-7FBE01D218AB"

# 2. 打开Safari调试
open -a Safari

# 3. 打开Xcode项目
open ios/App/App.xcworkspace
```

## 💡 调试技巧

### 1. 添加调试日志
```javascript
// 在Vue组件中添加
console.log('调试信息:', data);
console.error('错误信息:', error);
console.warn('警告信息:', warning);
```

### 2. 使用断点
```javascript
// 在代码中添加断点
debugger; // 代码会在此处暂停
```

### 3. 网络调试
```javascript
// 监控网络请求
fetch('/api/data')
  .then(response => {
    console.log('响应状态:', response.status);
    return response.json();
  })
  .then(data => console.log('响应数据:', data))
  .catch(error => console.error('请求错误:', error));
```

## 🎯 推荐调试流程

1. **开发阶段**: 使用Live Reload + Safari Web Inspector
2. **测试阶段**: 使用Xcode控制台查看系统日志
3. **性能优化**: 使用Safari Timeline分析
4. **问题排查**: 结合多种方法综合分析

## 🔧 故障排除

### 问题1: Safari无法连接
**解决方案**:
- 确保应用正在运行
- 检查Safari开发者菜单是否启用
- 重启Safari和模拟器

### 问题2: Live Reload不工作
**解决方案**:
- 检查网络连接
- 确认IP地址正确
- 重启开发服务器

### 问题3: 控制台无输出
**解决方案**:
- 检查JavaScript代码中的console.log
- 确认应用版本是最新的
- 重启应用

现在你可以像调试Web应用一样调试iOS应用了！🔍✨
