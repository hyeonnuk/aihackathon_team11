import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const initialForm = {
  name: '',
  studentNumber: '',
  gender: 'male',
  phoneNumber: '',
  email: '',
  loginId: '',
  password: '',
  passwordConfirm: '',
};

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function Signup() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const updateField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const updatePhoneNumber = (event) => {
    setForm((prev) => ({
      ...prev,
      phoneNumber: formatPhoneNumber(event.target.value),
    }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    const requiredFields = [
      'name',
      'studentNumber',
      'phoneNumber',
      'email',
      'loginId',
      'password',
      'passwordConfirm',
    ];
    const hasBlank = requiredFields.some((field) => !form[field].trim());

    if (hasBlank) {
      alert('모든 회원가입 정보를 입력해주세요.');
      return;
    }

    if (form.password.length < 8) {
      alert('비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    if (form.password !== form.passwordConfirm) {
      alert('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          studentNumber: form.studentNumber.trim(),
          gender: form.gender,
          phoneNumber: form.phoneNumber.trim(),
          email: form.email.trim(),
          loginId: form.loginId.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || '회원가입에 실패했습니다.');
      }

      alert(`회원가입 성공!\n${data.user.name}님, 로그인해주세요.`);
      navigate('/login');
    } catch (error) {
      alert(`회원가입 실패\n${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
            <span className="text-sm font-extrabold text-white">C</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-800">COM:HUB</span>
        </div>

        <div className="w-full rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="mb-7">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">회원가입</p>
            <h1 className="text-2xl font-extrabold text-gray-800">계정을 만들어보세요</h1>
            <p className="mt-1.5 text-sm text-gray-400">서비스 이용을 위한 정보를 입력하세요</p>
          </div>

          <form onSubmit={handleSignup} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">이름</label>
              <input
                type="text"
                value={form.name}
                onChange={updateField('name')}
                placeholder="홍길동"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">학번</label>
              <input
                type="text"
                value={form.studentNumber}
                onChange={updateField('studentNumber')}
                placeholder="202412345"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">성별</label>
              <select
                value={form.gender}
                onChange={updateField('gender')}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">전화번호</label>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={updatePhoneNumber}
                placeholder="010-1234-5678"
                maxLength={13}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="example@cs.ac.kr"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">아이디</label>
              <input
                type="text"
                value={form.loginId}
                onChange={updateField('loginId')}
                placeholder="로그인에 사용할 아이디"
                autoComplete="username"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={updateField('password')}
                placeholder="8자 이상"
                autoComplete="new-password"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">비밀번호 확인</label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={updateField('passwordConfirm')}
                placeholder="비밀번호 재입력"
                autoComplete="new-password"
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-indigo-300 sm:col-span-2"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span className="text-gray-400">이미 계정이 있으신가요?</span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>

  );
}

