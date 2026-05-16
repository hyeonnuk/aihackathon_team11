import { useState } from 'react';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [helloData, setHelloData] = useState(null);
  const [echoInput, setEchoInput] = useState('');
  const [echoResult, setEchoResult] = useState(null);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const setLoadingKey = (key, value) =>
    setLoading((prev) => ({ ...prev, [key]: value }));
  const setErrorKey = (key, value) =>
    setErrors((prev) => ({ ...prev, [key]: value }));

  async function checkHealth() {
    setLoadingKey('health', true);
    setErrorKey('health', null);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthStatus(data);
    } catch (e) {
      setErrorKey('health', '백엔드에 연결할 수 없습니다: ' + e.message);
    } finally {
      setLoadingKey('health', false);
    }
  }

  async function fetchHello() {
    setLoadingKey('hello', true);
    setErrorKey('hello', null);
    try {
      const res = await fetch('/api/hello');
      const data = await res.json();
      setHelloData(data);
    } catch (e) {
      setErrorKey('hello', '요청 실패: ' + e.message);
    } finally {
      setLoadingKey('hello', false);
    }
  }

  async function sendEcho() {
    if (!echoInput.trim()) return;
    setLoadingKey('echo', true);
    setErrorKey('echo', null);
    try {
      const res = await fetch('/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: echoInput }),
      });
      const data = await res.json();
      setEchoResult(data);
    } catch (e) {
      setErrorKey('echo', '요청 실패: ' + e.message);
    } finally {
      setLoadingKey('echo', false);
    }
  }

  return (
    <div className="container">
      <h1>프론트 ↔ 백엔드 연결 테스트</h1>

      {/* Health Check */}
      <section className="card">
        <h2>1. Health Check (GET /api/health)</h2>
        <button onClick={checkHealth} disabled={loading.health}>
          {loading.health ? '확인 중...' : '서버 상태 확인'}
        </button>
        {errors.health && <p className="error">{errors.health}</p>}
        {healthStatus && (
          <pre className="result success">{JSON.stringify(healthStatus, null, 2)}</pre>
        )}
      </section>

      {/* Hello */}
      <section className="card">
        <h2>2. Hello 메시지 (GET /api/hello)</h2>
        <button onClick={fetchHello} disabled={loading.hello}>
          {loading.hello ? '가져오는 중...' : '메시지 가져오기'}
        </button>
        {errors.hello && <p className="error">{errors.hello}</p>}
        {helloData && (
          <pre className="result success">{JSON.stringify(helloData, null, 2)}</pre>
        )}
      </section>

      {/* Echo POST */}
      <section className="card">
        <h2>3. Echo 테스트 (POST /api/echo)</h2>
        <div className="input-row">
          <input
            type="text"
            value={echoInput}
            onChange={(e) => setEchoInput(e.target.value)}
            placeholder="전송할 텍스트 입력"
            onKeyDown={(e) => e.key === 'Enter' && sendEcho()}
          />
          <button onClick={sendEcho} disabled={loading.echo || !echoInput.trim()}>
            {loading.echo ? '전송 중...' : '전송'}
          </button>
        </div>
        {errors.echo && <p className="error">{errors.echo}</p>}
        {echoResult && (
          <pre className="result success">{JSON.stringify(echoResult, null, 2)}</pre>
        )}
      </section>
    </div>
  );
}

export default App;
