require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// 연결 테스트 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '백엔드 서버가 정상 동작 중입니다.' });
});

// 샘플 데이터 엔드포인트
app.get('/api/hello', (req, res) => {
  res.json({
    message: '안녕하세요! 프론트-백엔드 연결 성공!',
    timestamp: new Date().toISOString(),
  });
});

// POST 테스트 엔드포인트
app.post('/api/echo', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text 필드가 필요합니다.' });
  }
  res.json({ echo: text, receivedAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
