import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── 뱃지 시스템 설정 ──────────────────────────────────────────
// 뱃지 디자인 및 기본 정보
const BADGE_CONFIG = {
  BABY_MUHAN: { id: 'b1', label: '아기 무한이', icon: '👶', style: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-100', description: '캘린더에 일정 1회 이상 등록' },
  ADULT_MUHAN: { id: 'b2', label: '어른 무한이', icon: '🧑', style: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100', description: '캘린더 일정 10회 이상 등록' },
  GRANDMA_MUHAN: { id: 'b3', label: '할미 무한이', icon: '👵', style: 'bg-primary-50 text-primary-600 border-primary-200 ring-primary-100', description: '캘린더 일정 50회 이상 등록' },
  HACKATHON: { id: 'b4', label: '해커톤 참여자', icon: '💻', style: 'bg-violet-50 text-[#6e5a9e] border-violet-200 ring-violet-100', description: '해커톤 참여' },
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
  MASTER_MUHAN: { id: 'b15', label: '석사 무한이', icon: '📜', style: 'bg-primary-50 text-primary-700 border-primary-300 ring-primary-200', description: '내 글에 좋아요 40회 이상 받기' },
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(() => getStoredUser());
  const [profileImage, setProfileImage] = useState(() => getStoredUser()?.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPostsExpanded, setIsPostsExpanded] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [showBadgeInfo, setShowBadgeInfo] = useState(false);
  const [myPosts, setMyPosts] = useState(() => getStoredUser()?.posts || []);
  const [myComments, setMyComments] = useState(() => getStoredUser()?.comments || []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadLatestUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`);
        
        if (!response.ok) {
          throw new Error('데이터 불러오기 실패');
        }

        const data = await response.json();
        const latestUser = data.user || data;

        const localUser = getStoredUser() || {};
        
        // --- 작성한 글/댓글 데이터 추출 (백엔드 API 분리 대비) ---
        let fetchedPosts = latestUser.posts || latestUser.postList || [];
        let fetchedComments = latestUser.comments || latestUser.commentList || [];

        // 유저 정보에 글/댓글 배열이 없다면 개별 API 호출 시도
        if (fetchedPosts.length === 0) {
          try {
            const postsRes = await fetch(`${API_BASE_URL}/api/users/${user.id}/posts`);
            if (postsRes.ok) fetchedPosts = extractList(await postsRes.json(), 'posts');
          } catch (e) { /* ignore */ }
        }

        if (fetchedComments.length === 0) {
          try {
            const commentsRes = await fetch(`${API_BASE_URL}/api/users/${user.id}/comments`);
            if (commentsRes.ok) fetchedComments = extractList(await commentsRes.json(), 'comments');
          } catch (e) { /* ignore */ }
        }

        // 🌟 실제 DB 통계와 로컬 통계 중 더 높은 값 사용 (자동 뱃지 부여 보장)
        const serverStats = latestUser.stats || {};
        const realStats = {
          scheduleCount: serverStats.scheduleCount ?? fetchedPosts.length,
          hasJoinedHackathon: serverStats.hasJoinedHackathon || false,
          commentCount: serverStats.commentCount ?? fetchedComments.length,
          isFirstCommenter: serverStats.isFirstCommenter || false,
          likesCount: serverStats.likesCount || 0,
          receivedLikesCount: serverStats.receivedLikesCount || 0,
          dislikesCount: serverStats.dislikesCount || 0
        };

        const updatedUser = { ...localUser, ...latestUser, stats: realStats, posts: fetchedPosts, comments: fetchedComments };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfileImage(updatedUser.profileImage || null);
        setMyPosts(fetchedPosts);
        setMyComments(fetchedComments);
      } catch (error) {
        // 네트워크 에러(백엔드 미연결) 시 로컬 스토리지 데이터를 최우선으로 사용하여 프로필에 반영
        const localUser = getStoredUser() || user;
        const localPosts = localUser?.posts || [];
        const localComments = localUser?.comments || [];
        const localStatsObj = localUser?.stats || {};
        const localStats = {
          scheduleCount: localStatsObj.scheduleCount || 0,
          hasJoinedHackathon: localStatsObj.hasJoinedHackathon || false,
          commentCount: Math.max(localStatsObj.commentCount || 0, localComments.length), // 작성한 댓글 개수를 세어 뱃지 부여
          isFirstCommenter: localStatsObj.isFirstCommenter || false,
          likesCount: localStatsObj.likesCount || 0,
          receivedLikesCount: localStatsObj.receivedLikesCount || 0,
          dislikesCount: localStatsObj.dislikesCount || 0
        };

        setUser(prev => ({ ...prev, ...localUser, stats: localStats }));
        setMyPosts(localPosts);
        setMyComments(localComments);
      }
    };

    loadLatestUser();
  }, [navigate, user?.id]);

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    setIsUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProfileImage(dataUrl);

      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/profile-image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: dataUrl }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.message || '프로필 이미지 저장에 실패했습니다.');
      }

      const updatedUser = { ...user, profileImage: data.profileImage };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert('프로필 이미지가 저장되었습니다.');
    } catch (error) {
      alert(`프로필 이미지 저장 실패\n${error.message}`);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="mb-4 w-full max-w-lg">
        <button
          onClick={() => navigate('/')}
          className="text-sm font-medium text-gray-400 transition-colors hover:text-primary-500"
        >
          대시보드로 돌아가기
        </button>
      </div>

      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-primary-500 to-violet-500" />

        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-primary-500 shadow-md disabled:cursor-wait"
            >
              {profileImage ? (
                <img src={profileImage} alt="프로필" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-white">{user.name?.charAt(0)}</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {isUploading ? '저장 중' : '변경'}
              </span>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <h1 className="flex items-baseline gap-2 text-xl font-extrabold text-gray-800">
            {user.name}
            <span className="text-sm font-semibold text-gray-400">@{user.loginId || 'unknown'}</span>
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            학번: {user.studentNumber || '학번 정보 없음'}
          </p>

          <div className="my-5 h-px bg-gray-100" />

          {/* 뱃지 */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500">획득한 뱃지</p>
            <button 
              onClick={() => setShowBadgeInfo(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-500 rounded-lg text-xs font-bold hover:bg-primary-100 active:scale-95 transition-all shadow-sm"
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
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-sm transition-all duration-200 hover:ring-4 ${badge.style}`}
              >
                <span className="text-xs font-extrabold">{badge.icon}</span>
                <span className="text-xs font-extrabold">{badge.label}</span>
              </div>
            ))}
            {/* 획득한 뱃지가 0개일 때 */}
            {getEarnedBadges(user.stats).length === 0 && (
              <p className="text-xs text-gray-400 font-medium">아직 획득한 뱃지가 없습니다.</p>
            )}
          </div>

          <div className="my-5 h-px bg-gray-100" />

          {/* 본인이 쓴 글 */}
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary-500">
            작성한 글
          </p>
          <div className="mb-5 flex flex-col gap-2">
            {myPosts.length > 0 ? (
              (isPostsExpanded ? myPosts : myPosts.slice(0, 3)).map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate(`/?scheduleId=${post.id}`)}
                  className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-left transition-all hover:border-primary-200 hover:bg-primary-50/30"
                >
                  <p className="text-sm font-semibold text-gray-700">{post.title || post.subject || '제목 없음'}</p>
                  <p className="mt-1 text-xs text-gray-400">{post.date || post.createdAt || post.created_at}</p>
                </button>
              ))
            ) : (
              <p className="px-1 text-xs font-medium text-gray-400">아직 작성한 글이 없습니다.</p>
            )}
            {myPosts.length > 3 && (
              <button
                onClick={() => setIsPostsExpanded(!isPostsExpanded)}
                className="mt-1 rounded-xl py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100"
              >
                {isPostsExpanded ? '접기 ▲' : '펼쳐보기 ▼'}
              </button>
            )}
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary-500">
            작성한 댓글
          </p>
          <div className="flex flex-col gap-2">
            {myComments.length > 0 ? (
              (isCommentsExpanded ? myComments : myComments.slice(0, 3)).map((comment) => (
                <button
                  key={comment.id}
                  type="button"
                  onClick={() =>
                    navigate(`/?scheduleId=${comment.scheduleId || comment.postId || comment.post_id}&commentId=${comment.id}`)
                  }
                  className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-left transition-all hover:border-primary-200 hover:bg-primary-50/30"
                >
                  <p className="mb-1 text-xs font-medium text-primary-500">
                    원문: {comment.postTitle || comment.post_title || '게시글 확인하기'}
                  </p>
                  <p className="text-sm text-gray-700">{comment.content || comment.body || '내용 없음'}</p>
                  <p className="mt-1 text-xs text-gray-400">{comment.date || comment.createdAt || comment.created_at}</p>
                </button>
              ))
            ) : (
              <p className="px-1 text-xs font-medium text-gray-400">아직 작성한 댓글이 없습니다.</p>
            )}
            {myComments.length > 3 && (
              <button
                onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                className="mt-1 rounded-xl py-2 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100"
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
                            isEarned ? 'bg-white border-primary-100 shadow-sm' : 'bg-gray-100/50 border-transparent grayscale opacity-50'
                          }`}
                        >
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 border shadow-sm rounded-full shrink-0 ${badge.style}`}>
                            <span className="text-sm">{badge.icon}</span>
                            <span className="text-xs font-extrabold">{badge.label}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-700 font-medium break-keep">{badge.description}</span>
                            {isEarned && <span className="text-[10px] text-primary-500 font-bold mt-0.5 tracking-tight">획득 완료!</span>}
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
                className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 transition-colors shadow-sm"
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
