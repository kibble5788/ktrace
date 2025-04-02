# KTrace埋点数据接收服务器

这是一个简单的Node.js服务器，用于接收KTrace埋点SDK上报的数据并存储到JSON文件。

## 功能特点

- 接收埋点数据并保存到JSON文件
- 提供查看所有数据的API端点
- 支持跨域请求
- 提供清空数据的功能

## 安装

1. 进入server目录:
```bash
cd server
```

2. 安装依赖:
```bash
npm install
```

## 使用方法

1. 启动服务器:
```bash
npm start
```

2. 服务器将在默认端口(3000)上启动，可以通过环境变量PORT修改端口。

## API端点

- `POST /collect`: 接收埋点数据
- `GET /data`: 查看所有已收集的数据
- `DELETE /data`: 清空所有数据

## 与KTrace SDK配合使用

在KTrace SDK初始化时，将serverUrl设置为此服务器的地址:

```javascript
window.ktrace.init({
  appId: 'demo-app',
  serverUrl: 'http://localhost:3000/collect',
  debug: true,
  enableAutoTrack: true
});
```

## 数据存储

所有接收的数据将被存储在 `./data/tracking_data.json` 文件中。 