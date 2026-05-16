import { useState, useEffect } from 'react';
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
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// ── 서버 에러 파싱 ──────────────────────────────────────────
function parseServerError(data, status) {
  // FastAPI 배열 형식 validation error
  if (Array.isArray(data?.detail)) {
    const msgs = data.detail.map((d) => {
      const field = d.loc?.slice(-1)[0] ?? '';
      const FIELD_KO = { name:'이름', studentNumber:'학번', phoneNumber:'전화번호', email:'이메일', loginId:'아이디', password:'비밀번호', gender:'성별' };
      const label = FIELD_KO[field] ?? field;
      return label ? `${label}: ${d.msg}` : d.msg;
    });
    return msgs.join('\n');
  }

  // 백엔드 메시지 필드
  const raw = data?.detail ?? data?.message ?? data?.error ?? data?.msg;
  if (typeof raw === 'string' && raw) {
    // 영문 백엔드 메시지 → 한국어 변환
    const KO_MAP = {
      'Student number, email, or login id already exists.': '이미 사용 중인 학번, 이메일 또는 아이디입니다.',
      'Signup failed.': '서버 오류로 회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.',
      'Database pool is not ready.': '데이터베이스 연결이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.',
      'Database connection failed.': '데이터베이스 연결에 실패했습니다.',
    };
    return KO_MAP[raw] ?? raw;
  }

  // HTTP 상태 코드별 기본
  if (status === 404) return 'API 경로를 찾을 수 없습니다. 백엔드 서버 주소를 확인해주세요.';
  if (status === 409) return '이미 사용 중인 학번, 이메일 또는 아이디입니다.';
  if (status === 400) return '입력 정보가 올바르지 않습니다.';
  if (status === 422) return '입력값 형식이 올바르지 않습니다.';
  if (status === 503) return '서버가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  return `회원가입에 실패했습니다. (HTTP ${status})`;
}

// ── 에러 토스트 ──────────────────────────────────────────────
function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-white border border-red-200 shadow-lg rounded-2xl px-5 py-4 w-full max-w-sm animate-slideDown">
      <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">회원가입 실패</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{message}</p>
      </div>
      <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 mt-0.5">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ── 인라인 에러 메시지 ────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

const BASE_INPUT = 'rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder-gray-300 transition focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent w-full';

export default function Signup() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    // 입력 시 해당 필드 에러 초기화
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const updatePhoneNumber = (event) => {
    setForm((prev) => ({ ...prev, phoneNumber: formatPhoneNumber(event.target.value) }));
    if (fieldErrors.phoneNumber) setFieldErrors((prev) => ({ ...prev, phoneNumber: '' }));
  };

  // ── 클라이언트 유효성 검사 → fieldErrors 반환 ────────────────
  function validate() {
    const errs = {};
    if (!form.name.trim())           errs.name           = '이름을 입력해주세요.';
    if (!form.studentNumber.trim())  errs.studentNumber  = '학번을 입력해주세요.';
    if (!form.phoneNumber.trim())    errs.phoneNumber    = '전화번호를 입력해주세요.';
    if (!form.email.trim())          errs.email          = '이메일을 입력해주세요.';
    if (!form.loginId.trim())        errs.loginId        = '아이디를 입력해주세요.';
    if (!form.password)              errs.password       = '비밀번호를 입력해주세요.';
    else if (form.password.length < 8) errs.password     = '비밀번호는 8자 이상이어야 합니다.';
    if (!form.passwordConfirm)          errs.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    else if (form.password !== form.passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    return errs;
  }

  const handleSignup = async (event) => {
    event.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      // 네트워크 에러(백엔드 미실행, CORS 등) 별도 처리
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
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
      } catch {
        throw new Error('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(parseServerError(data, response.status));
      }

      navigate('/login');
    } catch (error) {
      setErrorMsg(error.message || '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `${BASE_INPUT} ${fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'}`;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      {errorMsg && <ErrorToast message={errorMsg} onClose={() => setErrorMsg('')} />}

      <div className="mx-auto w-full max-w-lg">
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 shadow-sm">
            <span className="text-sm font-extrabold text-white">C</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-800">COM:HUB</span>
        </div>

        <div className="w-full rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="mb-7">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">회원가입</p>
            <h1 className="text-2xl font-extrabold text-gray-800">계정을 만들어보세요</h1>
            <p className="mt-1.5 text-sm text-gray-400">서비스 이용을 위한 정보를 입력하세요</p>
          </div>

          <form onSubmit={handleSignup} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">이름</label>
              <input type="text" value={form.name} onChange={updateField('name')} placeholder="홍길동" className={inputClass('name')} />
              <FieldError msg={fieldErrors.name} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">학번</label>
              <input type="text" value={form.studentNumber} onChange={updateField('studentNumber')} placeholder="202412345" className={inputClass('studentNumber')} />
              <FieldError msg={fieldErrors.studentNumber} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">성별</label>
              <select value={form.gender} onChange={updateField('gender')} className={inputClass('gender')}>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">전화번호</label>
              <input type="tel" value={form.phoneNumber} onChange={updatePhoneNumber} placeholder="010-1234-5678" maxLength={13} className={inputClass('phoneNumber')} />
              <FieldError msg={fieldErrors.phoneNumber} />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">이메일</label>
              <input type="email" value={form.email} onChange={updateField('email')} placeholder="example@cs.ac.kr" className={inputClass('email')} />
              <FieldError msg={fieldErrors.email} />
            </div>

            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">아이디</label>
              <input type="text" value={form.loginId} onChange={updateField('loginId')} placeholder="로그인에 사용할 아이디" autoComplete="username" className={inputClass('loginId')} />
              <FieldError msg={fieldErrors.loginId} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">비밀번호</label>
              <input type="password" value={form.password} onChange={updateField('password')} placeholder="8자 이상" autoComplete="new-password" className={inputClass('password')} />
              <FieldError msg={fieldErrors.password} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">비밀번호 확인</label>
              <input type="password" value={form.passwordConfirm} onChange={updateField('passwordConfirm')} placeholder="비밀번호 재입력" autoComplete="new-password" className={inputClass('passwordConfirm')} />
              <FieldError msg={fieldErrors.passwordConfirm} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-xl bg-primary-500 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-200 sm:col-span-2"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span className="text-gray-400">이미 계정이 있으신가요?</span>
            <button type="button" onClick={() => navigate('/login')} className="font-semibold text-primary-500 hover:text-primary-600">
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
