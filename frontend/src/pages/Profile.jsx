import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const MY_POSTS = [
  { id: 1, title: '교내 웹 해커톤 프론트엔드 모집합니다', date: '2026-05-01' },
  { id: 2, title: '알고리즘 주말 스터디 하실 분', date: '2026-04-20' },
];

const MY_COMMENTS = [
  {
    id: 1,
    postId: 101,
    postTitle: '카카오 코딩테스트 준비 스터디',
    content: '저도 참여하고 싶습니다.',
    date: '2026-05-10',
  },
  {
    id: 2,
    postId: 102,
    postTitle: 'Google ML Bootcamp 모집',
    content: '데이터 분석 자리 가능할까요?',
    date: '2026-05-12',
  },
];

const BADGES = ['해커톤 참가', '알고리즘 스터디', 'ML Bootcamp'];

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(() => getStoredUser());
  const [profileImage, setProfileImage] = useState(() => getStoredUser()?.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadLatestUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`);
        if (!response.ok) return;

        const data = await response.json();
        const latestUser = data.user;
        localStorage.setItem('user', JSON.stringify(latestUser));
        setUser(latestUser);
        setProfileImage(latestUser.profileImage || null);
      } catch {
        // Keep localStorage user when the network is unavailable.
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="mb-4 w-full max-w-lg">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 transition-colors hover:text-indigo-600"
        >
          대시보드로 돌아가기
        </button>
      </div>

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-md">
        <div className="h-24 bg-gradient-to-r from-indigo-500 to-blue-500" />

        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-indigo-600 shadow-md disabled:cursor-wait"
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

          <h2 className="mb-3 text-sm font-bold text-gray-700">획득한 배지</h2>
          <div className="flex flex-wrap gap-2">
            {BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="my-5 h-px bg-gray-100" />

          <h2 className="mb-3 text-sm font-bold text-gray-700">본인이 쓴 글</h2>
          <div className="mb-5 flex flex-col gap-2">
            {MY_POSTS.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => navigate(`/post/${post.id}`)}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100"
              >
                <p className="text-sm font-semibold text-gray-800">{post.title}</p>
                <p className="mt-1 text-xs text-gray-400">{post.date}</p>
              </button>
            ))}
          </div>

          <h2 className="mb-3 text-sm font-bold text-gray-700">본인이 쓴 댓글</h2>
          <div className="flex flex-col gap-2">
            {MY_COMMENTS.map((comment) => (
              <button
                key={comment.id}
                type="button"
                onClick={() => navigate(`/post/${comment.postId}`)}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100"
              >
                <p className="mb-1 text-xs font-medium text-indigo-600">원문: {comment.postTitle}</p>
                <p className="text-sm text-gray-700">{comment.content}</p>
                <p className="mt-1 text-xs text-gray-400">{comment.date}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
