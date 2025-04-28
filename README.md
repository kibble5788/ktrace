# KTrace 埋点分析 SDK

KTrace 是一个轻量级、跨平台的埋点分析 SDK，支持 Web、Vue、React 和 Electron 应用，提供用户行为追踪和错误监控功能。

## 功能特性

- **多平台支持**: Web、Vue、React 和 Electron
- **基础数据采集**: 用户身份识别、设备信息收集、页面访问数据等
- **用户行为追踪**: 点击事件、自定义事件追踪
- **错误监控**: JavaScript 异常、Promise 错误、API 请求错误、资源加载失败监控
- **灵活配置**: 自定义采样率、数据处理
- **离线缓存**: 支持数据本地存储和批量上报

## 安装

```bash
npm install ktrace
```

## 基础用法

### Web 应用

```javascript
import ktrace from "ktrace";

// 初始化
ktrace.init({
  appId: "your-app-id",
  serverUrl: "https://analytics.example.com/collect",
  debug: true,
});

// 用户标识
ktrace.identify("user123", { level: "premium" });

// 事件追踪
ktrace.track("button_click", { buttonId: "submit-btn" });

// 页面访问追踪
ktrace.trackPageView("home_page", {
  referrer: document.referrer,
});

// 错误追踪
try {
  // 业务代码
} catch (error) {
  ktrace.trackError(error, {
    component: "LoginForm",
  });
}
```

### Vue 应用

```javascript
import Vue from "vue";
import { VueAdapter } from "ktrace";

// 创建适配器
const ktrace = VueAdapter({
  appId: "your-app-id",
  serverUrl: "https://analytics.example.com/collect",
});

// 安装Vue插件
Vue.use(ktrace);

// 在组件中使用
export default {
  methods: {
    onSubmit() {
      // 追踪事件
      this.$track("form_submit", {
        formName: "login",
      });

      // 其他业务逻辑...
    },
  },
};
```

### React 应用

```jsx
import React from "react";
import { TrackerProvider, useTracker } from "ktrace/react";

// 在应用顶层使用Provider
function App() {
  return (
    <TrackerProvider
      config={{
        appId: "your-app-id",
        serverUrl: "https://analytics.example.com/collect",
      }}
    >
      <YourApp />
    </TrackerProvider>
  );
}

// 在组件中使用hooks
function LoginButton() {
  const { track } = useTracker();

  const handleClick = () => {
    track("login_click");
    // 其他业务逻辑...
  };

  return <button onClick={handleClick}>登录</button>;
}
```

### Electron 应用

```javascript
// 在主进程中
import { createElectronAdapter } from "ktrace";

const tracker = createElectronAdapter(
  {
    appId: "your-app-id",
    serverUrl: "https://analytics.example.com/collect",
  },
  true
); // true表示主进程

// 在渲染进程中
import { createElectronAdapter } from "ktrace";

const tracker = createElectronAdapter({
  appId: "your-app-id",
  serverUrl: "https://analytics.example.com/collect",
});

// 使用方式与基础用法相同
tracker.track("app_started");
```

## 配置选项

| 选项            | 类型    | 默认值 | 说明                     |
| --------------- | ------- | ------ | ------------------------ |
| appId           | string  | -      | 应用标识                 |
| serverUrl       | string  | -      | 数据上报服务器地址       |
| enableAutoTrack | boolean | true   | 是否开启自动追踪         |
| debug           | boolean | false  | 是否开启调试模式         |
| maxBatchSize    | number  | 10     | 批量上报的最大事件数     |
| flushInterval   | number  | 5000   | 定时上报的时间间隔(毫秒) |
| sampleRate      | number  | 1.0    | 采样率(0-1)              |
| plugins         | array   | []     | 自定义插件               |

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发环境

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 本地测试

在 KTrace 项目根目录下执行：

```
   npm link
   npm unlink(卸载)
```

进入您想要使用 KTrace 的项目目录，然后执行

```
   npm link @ked3/ktrace
   npm unlink @ked3/ktrace(卸载)
```

发布 npm

```
npm login
npm publish
```

请注意，由于您的包名带有 scope @ked3，如果这是您的第一次发布，您需要添加参数：

```
npm publish --access public
```

## 许可证

MIT
