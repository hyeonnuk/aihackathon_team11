import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const INPUT =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 ' +
  'placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 ' +
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

function toHashtagText(hashtags) {
  return hashtags.length > 0 ? hashtags.map((tag) => `#${tag}`).join(' ') : null;
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

export default function EventAddModal({ isOpen, onClose, onCreated }) {
  const user = getStoredUser();
  const [form, setForm] = useState(() => initForm(user?.name));
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const commitTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !form.hashtags.includes(tag)) {
      setForm((prev) => ({ ...prev, hashtags: [...prev.hashtags, tag] }));
    }
    setTagInput('');
  };

  const handleTagKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commitTag();
    }

    if (event.key === 'Backspace' && tagInput === '') {
      setForm((prev) => ({ ...prev, hashtags: prev.hashtags.slice(0, -1) }));
    }
  };

  const removeTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      hashtags: prev.hashtags.filter((item) => item !== tag),
    }));
  };

  const resetAndClose = () => {
    setForm(initForm(user?.name));
    setTagInput('');
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

    const payload = {
      title: form.title.trim(),
      startDate: toApiDateTime(form.startDate),
      endDate: toApiDateTime(endDate),
      content: form.content.trim(),
      photo: form.photo?.name ?? null,
      link: form.link.trim() || null,
      note: form.note.trim() || null,
      grade: form.grade,
      notice: form.notice,
      hashtag: toHashtagText(form.hashtags),
      author: form.author,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || '일정 등록에 실패했습니다.');
      }

      alert('일정이 등록되었습니다.');
      onCreated?.(data);
      resetAndClose();
    } catch (error) {
      alert(`일정 등록 실패\n${error.message}`);
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
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">새 일정</p>
            <h2 className="text-lg font-extrabold text-gray-800 leading-tight">새 일정 등록</h2>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="시작일자" required>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={set('startDate')}
                  required
                  className={INPUT}
                />
              </Field>
              <Field label="마감일자">
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={set('endDate')}
                  className={INPUT}
                />
                <p className="mt-1 text-xs text-gray-400">비우면 시작일자와 동일하게 저장됩니다.</p>
              </Field>
            </div>

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
                <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50">
                  <span className="text-gray-500 truncate">
                    {form.photo ? form.photo.name : '이미지 선택'}
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
                  type="url"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="대상 학년" required>
                <select value={form.grade} onChange={set('grade')} className={INPUT}>
                  {GRADES.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </Field>

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
                    <div className="h-6 w-10 rounded-full bg-gray-200 transition-colors duration-200 peer-checked:bg-indigo-600" />
                    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-gray-600">
                    {form.notice ? '공지로 등록됩니다' : '일반 일정으로 등록됩니다'}
                  </span>
                </label>
              </Field>
            </div>

            <Field label="해시태그">
              <div
                className="flex min-h-[46px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 transition focus-within:border-transparent focus-within:ring-2 focus-within:ring-indigo-400"
                onClick={() => document.getElementById('tag-input')?.focus()}
              >
                {form.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeTag(tag);
                      }}
                      className="leading-none text-indigo-400 hover:text-indigo-700"
                    >
                      x
                    </button>
                  </span>
                ))}
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={commitTag}
                  placeholder={form.hashtags.length === 0 ? 'Enter 또는 Space로 태그 추가' : ''}
                  className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder-gray-300"
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="작성자">
                <input
                  type="text"
                  value={form.author}
                  readOnly
                  className={`${INPUT} cursor-not-allowed bg-gray-50 text-gray-400`}
                />
              </Field>
              <Field label="좋아요 수">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">
                  <span>0</span>
                  <span>등록 후 집계됩니다</span>
                </div>
              </Field>
            </div>
          </form>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={resetAndClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            form="event-add-form"
            disabled={isSubmitting}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {isSubmitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
