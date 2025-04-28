const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 数据存储路径
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tracking_data.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 如果数据文件不存在，创建一个空的JSON数组
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
}

// 中间件
app.use(cors()); // 允许跨域请求
app.use(bodyParser.json({ limit: '10mb' })); // 解析JSON请求体
app.use(morgan('dev')); // 日志记录

// 主数据接收端点
app.post('/collect', (req, res) => {
  try {
    const data = req.body;
    
    // 添加接收时间戳
    data.receivedAt = new Date().toISOString();
    
    // 读取现有数据
    const existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    // 添加新数据
    existingData.push(data);
    
    // 写回文件
    fs.writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2), 'utf8');
    
    console.log(`[${new Date().toISOString()}] 收到埋点数据:`, JSON.stringify(data).substring(0, 100) + '...');
    
    // 返回成功
    res.status(200).json({ success: true, message: '数据已接收' });
  } catch (error) {
    console.error('处理数据时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取所有数据的端点（用于调试）
app.get('/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.status(200).json(data||'[]');
  } catch (error) {
    console.error('读取数据时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 清空数据的端点（用于调试）
app.delete('/data', (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    res.status(200).json({ success: true, message: '数据已清空' });
  } catch (error) {
    console.error('清空数据时出错:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`KTrace埋点数据接收服务器已启动，监听端口 ${PORT}`);
  console.log(`数据将存储到: ${DATA_FILE}`);
  console.log(`接收埋点数据的端点: http://localhost:${PORT}/collect`);
  console.log(`查看所有数据的端点: http://localhost:${PORT}/data`);
}); 