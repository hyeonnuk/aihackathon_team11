// ============================================================
//  pages/Profile.jsx — 경로: /profile
//  내 프로필 페이지 (더미 UI)
//  - localStorage에서 유저 정보 읽어 카드 형태로 표시
//  - 비로그인 상태면 /login으로 리다이렉트
// ============================================================

import { useState, useEffect, useRef } from 'react';
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

// 더미 작성 글
const MY_POSTS = [
  { id: 1, title: '교내 웹 해커톤 프론트엔드 모집합니다!', date: '2026-05-01' },
  { id: 2, title: '알고리즘 주말 스터디 하실 분?', date: '2026-04-20' },
];

// 더미 작성 댓글
const MY_COMMENTS = [
  { id: 1, postId: 101, postTitle: '카카오 코딩테스트 준비 스터디', content: '저도 참여하고 싶습니다! DM 드릴게요.', date: '2026-05-10' },
  { id: 2, postId: 102, postTitle: 'Google ML Bootcamp 팀원 모집', content: '혹시 데이터 분석 자리 남았을까요?', date: '2026-05-12' },
];

// 더미 뱃지
const BADGES = ['웹 해커톤 참가자', '알고리즘 스터디', 'ML 부트캠프'];

// ── Profile: 프로필 페이지 컴포넌트 (export default) ─────────
export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // 1. 임시 세션(localStorage)에서 로그인 유무 확인
    const sessionUser = getStoredUser();
    if (!sessionUser) {
      navigate('/login');
      return;
    }

    // 2. DB에서 유저 데이터(학번, 이름 등) 가져오기
    const fetchUserFromDB = async () => {
      try {
        // 💡 프론트엔드와 백엔드 주소가 다를 수 있으므로 절대 경로(예: 8080)를 명시해줍니다.
        // 백엔드 포트가 다르다면 http://localhost:8080 부분을 수정해주세요.
        const res = await fetch(`http://localhost:8080/api/users/${sessionUser.id}`);
        
        if (res.ok) {
          const dbData = await res.json();
          console.log('✅ DB에서 받아온 유저 데이터:', dbData); // 개발자 도구(F12) 콘솔에서 실제 데이터 확인
          alert(`DB에서 가져온 유저 데이터:\n${JSON.stringify(dbData, null, 2)}`); // 팝업으로 데이터 확인
          // DB 데이터에 학번이 누락되어 있을 경우를 대비해, localStorage 데이터(sessionUser)와 병합합니다.
          setUser({ ...sessionUser, ...dbData });
        } else {
          console.error('서버에서 데이터를 불러오지 못했습니다. 상태 코드:', res.status);
          setUser(sessionUser); // 실패 시 로컬 스토리지 데이터로 유지
        }
      } catch (error) {
        console.error('DB에서 유저 정보를 가져오는데 실패했습니다:', error);
        setUser(sessionUser); // 네트워크 에러 발생 시 임시 데이터 유지
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserFromDB();
  }, [navigate]);

  // 이미지 업로드 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
      // TODO: 백엔드로 이미지 파일(file) 전송 API 호출 추가 필요
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-sm text-gray-400 font-medium">데이터를 불러오는 중...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">

      {/* 뒤로 가기 */}
      <div className="w-full max-w-lg mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors font-medium"
        >
          ← 대시보드로 돌아가기
        </button>
      </div>

      {/* 프로필 카드 */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* 상단 배너 */}
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-violet-500" />

        {/* 아바타 + 기본 정보 */}
        <div className="px-6 pb-6">
          {/* 아바타: 배너와 겹치도록 -mt 처리 */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl bg-indigo-600 border-4 border-white shadow-md flex items-center justify-center cursor-pointer overflow-hidden relative group"
            >
              {profileImage ? (
                <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-white">
                  {user.name.charAt(0)}
                </span>
              )}
              {/* 호버 시 사진 변경 안내 오버레이 */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                변경
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
            />
          </div>

          {/* 이름 / 역할 / 학번 */}
          <h1 className="text-xl font-extrabold text-gray-800 flex items-baseline gap-2">
            {user.name}
            <span className="text-sm font-semibold text-gray-400">@{user.loginId || user.login_id || '아이디 없음'}</span>
          </h1>
          <p className="text-sm text-indigo-600 font-semibold mt-0.5">{user.role}</p>
          <p className="text-xs text-gray-400 mt-1">학번: {user.student_number || user.studentNumber || user.studentId || user.STUDENT_NUMBER || '학번 정보 없음'}</p>

          {/* 구분선 */}
          <div className="h-px bg-gray-100 my-5" />

          {/* 뱃지 */}
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">뱃지</p>
          <div className="flex flex-wrap gap-2">
            {BADGES.map((badge) => (
              <span
                key={badge}
                className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full border border-indigo-100"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* 구분선 */}
          <div className="h-px bg-gray-100 my-5" />

          {/* 본인이 쓴 글 */}
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">작성한 글</p>
          <div className="flex flex-col gap-2 mb-5">
            {MY_POSTS.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="p-3 bg-slate-50 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-700">{post.title}</p>
                <p className="text-xs text-gray-400 mt-1">{post.date}</p>
              </div>
            ))}
          </div>

          {/* 본인이 쓴 댓글 */}
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">작성한 댓글</p>
          <div className="flex flex-col gap-2">
            {MY_COMMENTS.map((comment) => (
              <div
                key={comment.id}
                onClick={() => navigate(`/post/${comment.postId}`)}
                className="p-3 bg-slate-50 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer"
              >
                <p className="text-xs text-indigo-500 font-medium mb-1">원문: {comment.postTitle}</p>
                <p className="text-sm text-gray-700">{comment.content}</p>
                <p className="text-xs text-gray-400 mt-1">{comment.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
