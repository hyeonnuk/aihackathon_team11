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
    <div className="flex min-h-screen bg-surface">
      {/* 왼쪽 브랜드 패널 */}
      <div className="hidden lg:flex lg:w-[420px] shrink-0 bg-primary-500 flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-extrabold">C</span>
          </div>
          <span className="text-white text-base font-extrabold tracking-tight">COM:HUB</span>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-white leading-snug mb-3">
            일정을 함께<br />관리하세요
          </h2>
          <p className="text-primary-200 text-sm leading-relaxed">
            COM:HUB로 학교 일정, 스터디, 공모전 등<br />
            모든 활동을 한눈에 확인하세요.
          </p>
        </div>

        <div className="flex gap-2">
          {['해커톤', '스터디', '공모전', '장학'].map((tag) => (
            <span key={tag} className="px-3 py-1 bg-white/10 text-white/80 text-xs font-medium rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* 모바일용 로고 */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-extrabold">C</span>
            </div>
            <span className="text-lg font-extrabold text-gray-800 tracking-tight">COM:HUB</span>
          </div>

          <div className="mb-8">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">로그인</p>
            <h1 className="text-2xl font-extrabold text-gray-800 leading-tight">다시 오신 것을<br />환영합니다</h1>
            <p className="mt-2 text-sm text-gray-400">아이디와 비밀번호로 접속하세요</p>
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
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-300"
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
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-primary-500 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-200"
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span className="text-gray-400">계정이 없으신가요?</span>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-semibold text-primary-500 hover:text-primary-600"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
