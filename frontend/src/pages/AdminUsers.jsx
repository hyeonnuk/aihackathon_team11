import { useEffect, useMemo, useState } from 'react';
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

function getStoredToken() {
  return localStorage.getItem('token') || '';
}

function roleLabel(role) {
  if (role === 'master') return '마스터';
  if (role === 'admin') return '관리자';
  return '일반';
}

function roleBadgeClass(role) {
  if (role === 'master') return 'bg-violet-50 text-violet-700 ring-violet-200';
  if (role === 'admin') return 'bg-primary-50 text-primary-700 ring-primary-200';
  return 'bg-gray-50 text-gray-500 ring-gray-200';
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const token = getStoredToken();

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((item) =>
      [item.name, item.loginId, item.studentNumber, item.email, roleLabel(item.role)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [query, users]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'master') {
      navigate('/');
      return;
    }

    const loadUsers = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.detail || data.message || '계정 목록을 불러오지 못했습니다.');
        }
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [navigate, token, user]);

  const updateRole = async (targetUser, nextRole) => {
    if (targetUser.role === nextRole) return;
    const action = nextRole === 'admin' ? '관리자로 지정' : '관리자 권한을 해제';
    if (!window.confirm(`${targetUser.name} 계정을 ${action}할까요?`)) return;

    setUpdatingId(targetUser.id);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.message || '권한 변경에 실패했습니다.');
      }
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? data.user : item)));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-sm font-extrabold text-white shadow-sm"
            >
              C
            </button>
            <div>
              <p className="text-lg font-extrabold text-gray-900">COM:HUB</p>
              <p className="text-xs font-semibold text-gray-400">계정 권한 관리</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:border-primary-200 hover:text-primary-600"
          >
            메인으로
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">사용자 권한</h1>
            <p className="mt-1 text-sm text-gray-500">마스터 계정만 관리자 권한을 추가하거나 해제할 수 있습니다.</p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 아이디, 학번, 이메일 검색"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-50 sm:w-80"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_1fr] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            <span>계정</span>
            <span>학번</span>
            <span>이메일</span>
            <span>권한</span>
            <span className="text-right">관리</span>
          </div>

          {isLoading ? (
            <div className="px-5 py-12 text-center text-sm font-semibold text-gray-400">계정 목록을 불러오는 중입니다.</div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm font-semibold text-gray-400">표시할 계정이 없습니다.</div>
          ) : (
            filteredUsers.map((item) => {
              const isMaster = item.role === 'master';
              const isUpdating = updatingId === item.id;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_1fr] items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-800">{item.name}</p>
                    <p className="truncate text-xs text-gray-400">{item.loginId}</p>
                  </div>
                  <p className="truncate text-sm text-gray-500">{item.studentNumber}</p>
                  <p className="truncate text-sm text-gray-500">{item.email}</p>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${roleBadgeClass(item.role)}`}>
                    {roleLabel(item.role)}
                  </span>
                  <div className="flex justify-end">
                    {isMaster ? (
                      <span className="text-xs font-semibold text-gray-300">변경 불가</span>
                    ) : item.role === 'admin' ? (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateRole(item, 'user')}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        관리자 해제
                      </button>
                    ) : (
                      <button
                        disabled={isUpdating}
                        onClick={() => updateRole(item, 'admin')}
                        className="rounded-lg bg-primary-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-600 disabled:opacity-50"
                      >
                        관리자 지정
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
