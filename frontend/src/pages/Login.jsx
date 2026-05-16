// ============================================================
//  pages/Login.jsx — 경로: /login
//  가짜 로그인(Fake Login)
//  - 이메일/비번 유효성 검사 없이 버튼 클릭만으로 로그인 처리
//  - localStorage에 유저 정보 저장 후 홈(/)으로 이동
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// GitHub SVG 아이콘 (외부 아이콘 라이브러리 없이 인라인 사용)
function GitHubIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  );
}

// ── Login: 로그인 페이지 컴포넌트 (export default) ───────────
export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // 가짜 로그인 핸들러
  // 실제 서버 인증 없이 localStorage에 유저 정보를 저장하고 홈으로 이동
  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem(
      'user',
      JSON.stringify({ name: '김컴공', role: '프론트엔드', studentId: '20201234' })
    );
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">

      {/* 로그인 카드 */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* 로고 */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-extrabold text-base">S</span>
          </div>
          <span className="text-2xl font-extrabold text-gray-800 tracking-tight">Sync-CS</span>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-800">Sync-CS 시작하기</h1>
          <p className="text-sm text-gray-400 mt-1.5">CS 학과 일정을 함께 관리하세요</p>
        </div>

        {/* 이메일 / 비밀번호 폼 */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          {/* 이메일 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@cs.ac.kr"
              className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          {/* 비밀번호 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">비밀번호</label>
              <span className="text-xs text-indigo-500 cursor-pointer hover:underline">
                비밀번호 찾기
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="mt-2 w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
          >
            로그인
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">또는</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* GitHub 로그인 버튼 (디자인 전용 — 실제 OAuth 연동 전) */}
        <button
          type="button"
          className="w-full py-3 flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all text-sm font-semibold text-gray-700"
        >
          <GitHubIcon />
          GitHub로 로그인
        </button>

        {/* 회원가입 안내 */}
        <p className="text-xs text-gray-400 text-center mt-7">
          아직 계정이 없으신가요?{' '}
          <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
            회원가입
          </span>
        </p>
      </div>
    </div>
  );
}
