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
  { id: 5, title: '자바스크립트 딥다이브 스터디원 구함', date: '2026-04-15' },
  { id: 6, title: '졸업작품 팀원 찾습니다 (백엔드 1명)', date: '2026-04-10' },
];

// 더미 작성 댓글
const MY_COMMENTS = [
  { id: 1, postId: 101, postTitle: '카카오 코딩테스트 준비 스터디', content: '저도 참여하고 싶습니다! DM 드릴게요.', date: '2026-05-10' },
  { id: 2, postId: 102, postTitle: 'Google ML Bootcamp 팀원 모집', content: '혹시 데이터 분석 자리 남았을까요?', date: '2026-05-12' },
  { id: 5, postId: 103, postTitle: '리액트 프로젝트 하실 분', content: '프론트엔드 지원합니다!', date: '2026-05-13' },
  { id: 6, postId: 104, postTitle: '스프링 스터디 모집', content: '아직 모집 중이신가요?', date: '2026-05-14' },
];

// ── 뱃지 시스템 설정 ──────────────────────────────────────────
// 뱃지 디자인 및 기본 정보
const BADGE_CONFIG = {
  BABY_MUHAN: { id: 'b1', label: '아기 무한이', icon: '👶', style: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-100', description: '캘린더에 일정 1회 이상 등록' },
  ADULT_MUHAN: { id: 'b2', label: '어른 무한이', icon: '🧑', style: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100', description: '캘린더 일정 10회 이상 등록' },
  GRANDMA_MUHAN: { id: 'b3', label: '할미 무한이', icon: '👵', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-100', description: '캘린더 일정 50회 이상 등록' },
  HACKATHON: { id: 'b4', label: '해커톤 참여자', icon: '💻', style: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-100', description: '해커톤 참여' },
  STRAIGHT_MUHAN: { id: 'b5', label: '직진중인 무한이', icon: '🏃', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100', description: '댓글 3회 이상 작성' },
  SPEEDING_MUHAN: { id: 'b6', label: '과속 무한이', icon: '💨', style: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-100', description: '댓글 5회 이상 작성' },
  RAMPAGE_MUHAN: { id: 'b7', label: '폭주 무한이', icon: '🏍️', style: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-100', description: '댓글 10회 이상 작성' },
  MEGAPHONE_MUHAN: { id: 'b8', label: '확성기 무한이', icon: '📢', style: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100', description: '글에 1등 댓글 달기' },
  HAPPY_MUHAN_1: { id: 'b9_1', label: '해피 무한이', icon: '😊', style: 'bg-pink-50 text-pink-700 border-pink-200 ring-pink-100', description: '좋아요 1회 이상 누르기' },
  HAPPY_MUHAN: { id: 'b9', label: '행복한 무한이', icon: '🥰', style: 'bg-pink-50 text-pink-700 border-pink-200 ring-pink-100', description: '좋아요 5회 이상 누르기' },
  DOPAMINE_MUHAN: { id: 'b10', label: '도파민 무한이', icon: '🤩', style: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 ring-fuchsia-100', description: '좋아요 10회 이상 누르기' },
  FAINT_MUHAN: { id: 'b11', label: '행복해서 쓰러진 무한이', icon: '🫠', style: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-100', description: '좋아요 30회 이상 누르기' },
  
  SMART_MUHAN: { id: 'b12', label: '똑똑한 무한이', icon: '🤓', style: 'bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-100', description: '내 글에 좋아요 1회 이상 받기' },
  COMPETENT_MUHAN: { id: 'b13', label: '유능한 무한이', icon: '💼', style: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-100', description: '내 글에 좋아요 5회 이상 받기' },
  BACHELOR_MUHAN: { id: 'b14', label: '학사 무한이', icon: '🎓', style: 'bg-blue-50 text-blue-800 border-blue-300 ring-blue-200', description: '내 글에 좋아요 20회 이상 받기' },
  MASTER_MUHAN: { id: 'b15', label: '석사 무한이', icon: '📜', style: 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-indigo-200', description: '내 글에 좋아요 40회 이상 받기' },
  DOCTOR_MUHAN: { id: 'b16', label: '박사 무한이', icon: '🔬', style: 'bg-violet-50 text-violet-800 border-violet-300 ring-violet-200', description: '내 글에 좋아요 100회 이상 받기' },

  HATER_MUHAN: { id: 'b17', label: '싫어하는 무한이', icon: '😒', style: 'bg-stone-50 text-stone-700 border-stone-200 ring-stone-100', description: '싫어요 5회 이상 누르기' },
  NEGATIVE_MUHAN: { id: 'b18', label: '부정적인 무한이', icon: '😠', style: 'bg-zinc-50 text-zinc-700 border-zinc-200 ring-zinc-100', description: '싫어요 15회 이상 누르기' },
  HATE_ALL_MUHAN: { id: 'b19', label: '모든게 싫은 무한이', icon: '🤬', style: 'bg-neutral-50 text-neutral-800 border-neutral-300 ring-neutral-200', description: '싫어요 30회 이상 누르기' },
};

// 도감 모달용 뱃지 그룹핑 및 정렬 (작은 숫자 순)
const BADGE_GROUPS = [
  {
    title: '📅 캘린더 일정 (일정 등록 횟수)',
    badges: [BADGE_CONFIG.BABY_MUHAN, BADGE_CONFIG.ADULT_MUHAN, BADGE_CONFIG.GRANDMA_MUHAN],
  },
  {
    title: '💬 커뮤니티 (댓글 작성 횟수)',
    badges: [BADGE_CONFIG.STRAIGHT_MUHAN, BADGE_CONFIG.SPEEDING_MUHAN, BADGE_CONFIG.RAMPAGE_MUHAN],
  },
  {
    title: '👍 받은 반응 (내 글이 받은 좋아요)',
    badges: [BADGE_CONFIG.SMART_MUHAN, BADGE_CONFIG.COMPETENT_MUHAN, BADGE_CONFIG.BACHELOR_MUHAN, BADGE_CONFIG.MASTER_MUHAN, BADGE_CONFIG.DOCTOR_MUHAN],
  },
  {
    title: '❤️ 반응 (좋아요 누른 횟수)',
    badges: [BADGE_CONFIG.HAPPY_MUHAN_1, BADGE_CONFIG.HAPPY_MUHAN, BADGE_CONFIG.DOPAMINE_MUHAN, BADGE_CONFIG.FAINT_MUHAN],
  },
  {
    title: '👎 반응 (싫어요 누른 횟수)',
    badges: [BADGE_CONFIG.HATER_MUHAN, BADGE_CONFIG.NEGATIVE_MUHAN, BADGE_CONFIG.HATE_ALL_MUHAN],
  },
  {
    title: '⭐ 특별 미션',
    badges: [BADGE_CONFIG.MEGAPHONE_MUHAN, BADGE_CONFIG.HACKATHON],
  },
];

// 유저 통계 데이터를 기반으로 획득한 뱃지 목록을 반환하는 함수
function getEarnedBadges(stats) {
  if (!stats) return [];
  const earned = [];

  // 1~3. 캘린더 일정 등록 (조건 충족 시 하위 뱃지 누적 표시)
  if (stats.scheduleCount >= 1) earned.push(BADGE_CONFIG.BABY_MUHAN);
  if (stats.scheduleCount >= 10) earned.push(BADGE_CONFIG.ADULT_MUHAN);
  if (stats.scheduleCount >= 50) earned.push(BADGE_CONFIG.GRANDMA_MUHAN);

  // 4. 해커톤 참여
  if (stats.hasJoinedHackathon) earned.push(BADGE_CONFIG.HACKATHON);

  // 5, 6, 8. 댓글 작성 횟수 (조건 충족 시 하위 뱃지 누적 표시)
  if (stats.commentCount >= 3) earned.push(BADGE_CONFIG.STRAIGHT_MUHAN);
  if (stats.commentCount >= 5) earned.push(BADGE_CONFIG.SPEEDING_MUHAN);
  if (stats.commentCount >= 10) earned.push(BADGE_CONFIG.RAMPAGE_MUHAN);

  // 7. 공지사항 1등 댓글
  if (stats.isFirstCommenter) earned.push(BADGE_CONFIG.MEGAPHONE_MUHAN);

  // 9. 좋아요 누른 횟수 (조건 충족 시 하위 뱃지 누적 표시)
  if (stats.likesCount >= 1) earned.push(BADGE_CONFIG.HAPPY_MUHAN_1);
  if (stats.likesCount >= 5) earned.push(BADGE_CONFIG.HAPPY_MUHAN);
  if (stats.likesCount >= 10) earned.push(BADGE_CONFIG.DOPAMINE_MUHAN);
  if (stats.likesCount >= 30) earned.push(BADGE_CONFIG.FAINT_MUHAN);

  // 내가 쓴 글이 받은 좋아요 횟수
  if (stats.receivedLikesCount >= 1) earned.push(BADGE_CONFIG.SMART_MUHAN);
  if (stats.receivedLikesCount >= 5) earned.push(BADGE_CONFIG.COMPETENT_MUHAN);
  if (stats.receivedLikesCount >= 20) earned.push(BADGE_CONFIG.BACHELOR_MUHAN);
  if (stats.receivedLikesCount >= 40) earned.push(BADGE_CONFIG.MASTER_MUHAN);
  if (stats.receivedLikesCount >= 100) earned.push(BADGE_CONFIG.DOCTOR_MUHAN);

  // 싫어요 누른 횟수
  if (stats.dislikesCount >= 5) earned.push(BADGE_CONFIG.HATER_MUHAN);
  if (stats.dislikesCount >= 15) earned.push(BADGE_CONFIG.NEGATIVE_MUHAN);
  if (stats.dislikesCount >= 30) earned.push(BADGE_CONFIG.HATE_ALL_MUHAN);

  return earned;
}

// ── Profile: 프로필 페이지 컴포넌트 (export default) ─────────
export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [isPostsExpanded, setIsPostsExpanded] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [showBadgeInfo, setShowBadgeInfo] = useState(false);
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
          
          // 뱃지를 확인해 볼 수 있도록 더미 통계(stats) 값을 임시로 셋팅합니다. 
          // (나중에 DB에서 활동 내역을 보내준다면 dbData.stats 로 바로 교체됩니다)
          const mockStats = {
            scheduleCount: 12,       // 1이상, 10이상 -> 아기 무한이, 어른 무한이
            hasJoinedHackathon: true,// 참여 -> 해커톤 참여자
            commentCount: 6,         // 3이상, 5이상 -> 직진중, 과속 무한이
            isFirstCommenter: true,  // 1등 -> 확성기 무한이
            likesCount: 15,          // 1, 5, 10 -> 해피, 행복한, 도파민 무한이
            receivedLikesCount: 25,  // 1, 5, 20 -> 똑똑한, 유능한, 학사 무한이
            dislikesCount: 8         // 5이상 -> 싫어하는 무한이
          };
          
          // DB 데이터에 학번이 누락되어 있을 경우를 대비해, localStorage 데이터(sessionUser)와 병합합니다.
          setUser({ ...sessionUser, ...dbData, stats: dbData.stats || mockStats });
        } else {
          console.error('서버에서 데이터를 불러오지 못했습니다. 상태 코드:', res.status);
          setUser(sessionUser); // 실패 시 로컬 스토리지 데이터로 유지
        }
      } catch (error) {
        console.error('DB에서 유저 정보를 가져오는데 실패했습니다:', error);
        
        // 에러 시에도 뱃지 테스트 화면이 보이도록 임시 통계 추가
        setUser({ ...sessionUser, stats: { 
          scheduleCount: 1,         // 아기 무한이
          hasJoinedHackathon: false, 
          commentCount: 12,         // 폭주 무한이
          isFirstCommenter: false, 
          likesCount: 2,
          receivedLikesCount: 0,
          dislikesCount: 0
        }}); 
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">획득한 뱃지</p>
            <button 
              onClick={() => setShowBadgeInfo(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"
              title="뱃지 획득 조건 안내"
            >
              <span className="text-sm">💡</span>
              뱃지 도감
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {getEarnedBadges(user.stats).map((badge) => (
              <div
                key={badge.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 border shadow-sm rounded-full cursor-default hover:ring-4 transition-all duration-200 ${badge.style}`}
              >
                <span className="text-sm">{badge.icon}</span>
                <span className="text-xs font-extrabold">{badge.label}</span>
              </div>
            ))}
            {/* 획득한 뱃지가 0개일 때 */}
            {getEarnedBadges(user.stats).length === 0 && (
              <p className="text-xs text-gray-400 font-medium">아직 획득한 뱃지가 없습니다.</p>
            )}
          </div>

          {/* 구분선 */}
          <div className="h-px bg-gray-100 my-5" />

          {/* 본인이 쓴 글 */}
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">작성한 글</p>
          <div className="flex flex-col gap-2 mb-5">
            {(isPostsExpanded ? MY_POSTS : MY_POSTS.slice(0, 3)).map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="p-3 bg-slate-50 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer"
              >
                <p className="text-sm font-semibold text-gray-700">{post.title}</p>
                <p className="text-xs text-gray-400 mt-1">{post.date}</p>
              </div>
            ))}
            {MY_POSTS.length > 3 && (
              <button
                onClick={() => setIsPostsExpanded(!isPostsExpanded)}
                className="text-xs font-semibold text-gray-500 hover:bg-gray-100 py-2 rounded-xl transition-colors mt-1"
              >
                {isPostsExpanded ? '접기 ▲' : '펼쳐보기 ▼'}
              </button>
            )}
          </div>

          {/* 본인이 쓴 댓글 */}
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">작성한 댓글</p>
          <div className="flex flex-col gap-2">
            {(isCommentsExpanded ? MY_COMMENTS : MY_COMMENTS.slice(0, 3)).map((comment) => (
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
            {MY_COMMENTS.length > 3 && (
              <button
                onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                className="text-xs font-semibold text-gray-500 hover:bg-gray-100 py-2 rounded-xl transition-colors mt-1"
              >
                {isCommentsExpanded ? '접기 ▲' : '펼쳐보기 ▼'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 뱃지 도감 모달(팝업) */}
      {showBadgeInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            {/* 모달 헤더 */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                <span>뱃지 도감</span>
                <span className="text-lg">🏆</span>
              </h3>
              <button 
                onClick={() => setShowBadgeInfo(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none px-2"
              >
                &times;
              </button>
            </div>
            {/* 모달 내용 (뱃지 리스트) */}
            <div className="p-4 overflow-y-auto flex flex-col bg-slate-50">
              {BADGE_GROUPS.map((group, idx) => (
                <div key={idx} className="mb-5 last:mb-0">
                  <p className="text-[11px] font-bold text-gray-500 mb-2.5 px-1">{group.title}</p>
                  <div className="flex flex-col gap-2.5">
                    {group.badges.map((badge) => {
                      // 유저가 현재 해당 뱃지를 획득했는지 확인
                      const isEarned = getEarnedBadges(user?.stats).some(b => b.id === badge.id);
                      
                      return (
                        <div 
                          key={badge.id} 
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            isEarned ? 'bg-white border-indigo-100 shadow-sm' : 'bg-gray-100/50 border-transparent grayscale opacity-50'
                          }`}
                        >
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 border shadow-sm rounded-full shrink-0 ${badge.style}`}>
                            <span className="text-sm">{badge.icon}</span>
                            <span className="text-xs font-extrabold">{badge.label}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-700 font-medium break-keep">{badge.description}</span>
                            {isEarned && <span className="text-[10px] text-indigo-500 font-bold mt-0.5 tracking-tight">획득 완료!</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* 모달 푸터 */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <button 
                onClick={() => setShowBadgeInfo(false)} 
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
