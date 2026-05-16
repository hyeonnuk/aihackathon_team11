// ============================================================
//  pages/Profile.jsx — 경로: /profile
//  내 프로필 페이지 (더미 UI)
//  - localStorage에서 유저 정보 읽어 카드 형태로 표시
//  - 비로그인 상태면 /login으로 리다이렉트
// ============================================================

import { useNavigate } from 'react-router-dom';

// localStorage 헬퍼
function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// 더미 활동 내역
const ACTIVITY = [
  { id: 1, label: '지원한 모집글',   value: '3건',  color: 'bg-indigo-50 text-indigo-700' },
  { id: 2, label: '참여 예정 일정',  value: '2건',  color: 'bg-amber-50  text-amber-700'  },
  { id: 3, label: '작성한 모집글',   value: '1건',  color: 'bg-emerald-50 text-emerald-700' },
];

// 더미 뱃지
const BADGES = ['웹 해커톤 참가자', '알고리즘 스터디', 'ML 부트캠프'];

// ── Profile: 프로필 페이지 컴포넌트 (export default) ─────────
export default function Profile() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // 비로그인 상태 보호: 렌더링 전에 리다이렉트
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

      {/* 뒤로 가기 */}
      <div className="w-full max-w-lg mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          ← 대시보드로 돌아가기
        </button>
      </div>

      {/* 프로필 카드 */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md overflow-hidden">

        {/* 상단 배너 */}
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-blue-500" />

        {/* 아바타 + 기본 정보 */}
        <div className="px-6 pb-6">
          {/* 아바타: 배너와 겹치도록 -mt 처리 */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 border-4 border-white shadow-md flex items-center justify-center">
              <span className="text-3xl font-extrabold text-white">
                {user.name.charAt(0)}
              </span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              계정 전환
            </button>
          </div>

          {/* 이름 / 역할 / 학번 */}
          <h1 className="text-xl font-extrabold text-gray-800">{user.name}</h1>
          <p className="text-sm text-indigo-600 font-semibold mt-0.5">{user.role}</p>
          <p className="text-xs text-gray-400 mt-1">학번: {user.studentId}</p>

          {/* 구분선 */}
          <div className="h-px bg-gray-100 my-5" />

          {/* 활동 통계 */}
          <h2 className="text-sm font-bold text-gray-700 mb-3">활동 현황</h2>
          <div className="grid grid-cols-3 gap-3">
            {ACTIVITY.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl p-3 text-center ${item.color}`}
              >
                <p className="text-xl font-extrabold">{item.value}</p>
                <p className="text-xs mt-1 font-medium opacity-80">{item.label}</p>
              </div>
            ))}
          </div>

          {/* 구분선 */}
          <div className="h-px bg-gray-100 my-5" />

          {/* 뱃지 */}
          <h2 className="text-sm font-bold text-gray-700 mb-3">획득한 뱃지</h2>
          <div className="flex flex-wrap gap-2">
            {BADGES.map((badge) => (
              <span
                key={badge}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
