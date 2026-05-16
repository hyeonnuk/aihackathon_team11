import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const INPUT =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 ' +
  'placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 ' +
  'focus:border-transparent transition';

const GRADES = [
  { label: '전체', value: 'all' },
  { label: '1학년', value: '1' },
  { label: '2학년', value: '2' },
  { label: '3학년', value: '3' },
  { label: '4학년', value: '4' },
];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') ?? 'null');
  } catch {
    return null;
  }
}

function initForm(authorName) {
  return {
    title: '',
    startDate: '',
    endDate: '',
    content: '',
    photo: null,
    link: '',
    note: '',
    grade: 'all',
    notice: false,
    hashtags: [],
    author: authorName ?? 'unknown',
  };
}

function toApiDateTime(value) {
  return value ? `${value.replace('T', ' ')}:00` : '';
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

function DateTimePicker({ value, onChange, required }) {
  const [date, time] = value ? value.split('T') : ['', '09:00'];
  const setDate = (d) => onChange({ target: { value: d ? `${d}T${time || '09:00'}` : '' } });
  const setTime = (t) => onChange({ target: { value: date ? `${date}T${t}` : '' } });

  return (
    <div className="grid grid-cols-[7fr_3fr] gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required={required}
        className={INPUT}
      />
      <select
        value={time || '09:00'}
        onChange={(e) => setTime(e.target.value)}
        disabled={!date}
        className={`${INPUT} w-full disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}


function toHashtagText(hashtags) {
  return hashtags.length > 0 ? hashtags.map((tag) => `#${tag}`).join(' ') : null;
}

function fileToDataUrl(file) {
  if (!file) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('이미지 파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

function normalizeLink(link) {
  const trimmed = link.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function EventAddModal({ isOpen, onClose, onCreated, initialData = null, mode = 'add' }) {
  const user = getStoredUser();
const authorName = user?.repBadge ? `${user.repBadge} ${user.name}` : (user?.name ?? 'unknown');
const canManageNotice = user?.role === 'master' || user?.role === 'admin';

  const [form, setForm] = useState(() =>
    mode === 'edit' && initialData ? initialData : initForm(authorName),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm(initialData);
    } else {
      setForm(initForm(authorName));
    }
    setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetAndClose = () => {
    setForm(initForm(authorName));
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const endDate = form.endDate || form.startDate;
    if (!form.title.trim() || !form.startDate || !form.content.trim()) {
      alert('제목, 시작일자, 내용을 입력해주세요.');
      return;
    }

    let photoDataUrl = null;
    try {
      if (typeof form.photo === 'string') {
        photoDataUrl = form.photo;
      } else {
        photoDataUrl = await fileToDataUrl(form.photo);
      }
    } catch (error) {
      alert(error.message);
      return;
    }

    const payload = {
      title: form.title.trim(),
      startDate: toApiDateTime(form.startDate),
      endDate: toApiDateTime(endDate),
      content: form.content.trim(),
      photo: photoDataUrl,
      link: normalizeLink(form.link),
      note: form.note.trim() || null,
      grade: form.grade,
      notice: canManageNotice ? form.notice : false,
      hashtag: toHashtagText(form.hashtags),
      author: form.author,
    };

    setIsSubmitting(true);

    const isEdit = mode === 'edit';
    const url = isEdit
      ? `${API_BASE_URL}/api/schedules/${initialData.scheduleId}`
      : `${API_BASE_URL}/api/schedules`;
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      // -- LOCAL STORAGE FALLBACK LOGIC (백엔드 에러 대비 로컬 백업) --
      try {
        const existing = JSON.parse(localStorage.getItem('local_events') || '[]');
        const newEvent = {
          id: isEdit ? initialData.scheduleId || `local_${Date.now()}` : `local_${Date.now()}`,
          title: payload.title,
          start: payload.startDate.split(' ')[0],
          end: payload.endDate ? payload.endDate.split(' ')[0] : payload.startDate.split(' ')[0],
          backgroundColor: '#6366f1',
          borderColor: '#6366f1',
          extendedProps: {
            dateLabel: `${payload.startDate} ~ ${payload.endDate || payload.startDate}`,
            description: payload.content,
            recruitments: [],
            comments: [],
            author: payload.author,
            tags: payload.hashtag ? payload.hashtag.replace(/#/g, '').trim().split(/\s+/) : [],
          }
        };
        if (isEdit) {
          const idx = existing.findIndex(e => e.id === newEvent.id);
          if (idx > -1) existing[idx] = newEvent;
          else existing.push(newEvent);
        } else {
          existing.push(newEvent);
        }
        localStorage.setItem('local_events', JSON.stringify(existing));
      } catch(e) { console.error(e) }

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || (isEdit ? '일정 수정에 실패했습니다.' : '일정 등록에 실패했습니다.'));
      }

      alert(isEdit ? '일정이 수정되었습니다.' : '일정이 등록되었습니다.');
      onCreated?.(data);
      resetAndClose();
    } catch (error) {
      alert(`${isEdit ? '일정 수정' : '일정 등록'} 성공 (로컬에 저장됨)\n(서버 연동 오류: ${error.message})`);
      onCreated?.(payload);
      resetAndClose();
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={resetAndClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-gray-100"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-1">
              {mode === 'edit' ? '일정 수정' : '새 일정'}
            </p>
            <h2 className="text-lg font-extrabold text-gray-800 leading-tight">
              {mode === 'edit' ? '일정 수정' : '새 일정 등록'}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">작성한 일정은 캘린더에 표시됩니다.</p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="event-add-form" onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
            {canManageNotice && (
              <Field label="공지 여부">
                <label className="flex h-[46px] cursor-pointer select-none items-center gap-3">
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={form.notice}
                      className="peer sr-only"
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, notice: event.target.checked }))
                      }
                    />
                    <div className="h-6 w-10 rounded-full bg-gray-200 transition-colors duration-200 peer-checked:bg-primary-500" />
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
                  </div>
                  {form.notice && (
                    <span className="text-sm text-gray-600">공지로 등록됩니다</span>
                  )}
                </label>
              </Field>
            )}

            <Field label="제목" required>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="일정 제목을 입력하세요"
                required
                className={INPUT}
              />
            </Field>

            <Field label="시작일자" required>
              <DateTimePicker value={form.startDate} onChange={set('startDate')} required />
            </Field>
            <Field label="마감일자">
              <DateTimePicker value={form.endDate} onChange={set('endDate')} />
              <p className="mt-1 text-xs text-gray-400">비우면 시작일자와 동일하게 저장됩니다.</p>
            </Field>

            <Field label="내용" required>
              <textarea
                value={form.content}
                onChange={set('content')}
                rows={4}
                placeholder="일정에 대한 상세 내용을 입력하세요"
                required
                className={`${INPUT} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="사진">
                <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm transition-colors hover:border-primary-400 hover:bg-primary-50">
                  <span className="text-gray-500 truncate">
                    {form.photo
                      ? typeof form.photo === 'string' ? '기존 이미지' : form.photo.name
                      : '이미지 선택'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, photo: event.target.files[0] ?? null }))
                    }
                  />
                </label>
              </Field>
              <Field label="링크">
                <input
                  type="text"
                  value={form.link}
                  onChange={set('link')}
                  placeholder="https://..."
                  className={INPUT}
                />
              </Field>
            </div>

            <Field label="비고">
              <input
                type="text"
                value={form.note}
                onChange={set('note')}
                placeholder="기타 참고사항"
                className={INPUT}
              />
            </Field>

            <Field label="대상 학년" required>
              <select value={form.grade} onChange={set('grade')} className={INPUT}>
                {GRADES.map((grade) => (
                  <option key={grade.value} value={grade.value}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="해시태그">
              <div className="flex flex-wrap gap-2">
                {['공모전', '해커톤', '강의', '프로젝트', '장학/취업'].map((tag) => {
                  const isSelected = form.hashtags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          hashtags: isSelected
                            ? prev.hashtags.filter((t) => t !== tag)
                            : [...prev.hashtags, tag],
                        }))
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-primary-400 hover:text-primary-500'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </Field>

          </form>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="submit"
            form="event-add-form"
            disabled={isSubmitting}
            className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-300"
          >
            {isSubmitting ? '저장 중...' : (mode === 'edit' ? '수정 완료' : '등록 완료')}
          </button>
        </div>
      </div>
    </div>
  );
}
