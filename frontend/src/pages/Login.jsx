import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginId.trim() || !password) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: loginId.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || '로그인에 실패했습니다.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      alert(`로그인 성공!\n${data.user.name}님 환영합니다.`);
      navigate('/');
    } catch (error) {
      alert(`로그인 실패\n${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
            <span className="text-base font-extrabold text-white">C</span>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-gray-800">COM:HUB</span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-gray-800">로그인</h1>
          <p className="mt-1.5 text-sm text-gray-400">아이디와 비밀번호로 접속하세요</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">아이디</label>
            <input
              type="text"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">비밀번호</label>
              <span className="text-xs text-gray-400">8자 이상</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-400">계정이 없으신가요?</span>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
