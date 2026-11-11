import React, { useState } from 'react';
import {
  X,
  Plus,
  Shuffle,
  RotateCcw,
  Trash2,
  Check,
  Camera,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Pencil,
} from 'lucide-react';
import {
  HangulProblem,
  BASIC_CONSONANTS,
  BASIC_VOWELS,
  DOUBLE_CONSONANTS,
  COMPOUND_VOWELS,
  FUN_WORDS,
  ALL_PRESET_PROBLEMS,
  getKoreanParticle,
  formatPromptText,
} from '../data/hangulData';

export interface AppSettings {
  promptTemplate: string;
  autoPhotoOnSuccess: boolean;
  addPhotoFrame: boolean;
  classNameLabel: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  problems: HangulProblem[];
  onUpdateProblems: (newProblems: HangulProblem[]) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  problems,
  onUpdateProblems,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'letters' | 'custom' | 'options'>('letters');
  const [customChar, setCustomChar] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customName, setCustomName] = useState('');
  const [customTip, setCustomTip] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // State for editing an existing problem's text inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChar, setEditChar] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [editName, setEditName] = useState('');
  const [editTip, setEditTip] = useState('');

  if (!isOpen) return null;

  const activeChars = new Set(problems.map((p) => p.char));

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2200);
  };

  const toggleProblem = (preset: HangulProblem) => {
    const exists = problems.some((p) => p.char === preset.char);
    if (exists) {
      if (problems.length <= 1) {
        showToast('최소 1개 이상의 문제가 필요해요!');
        return;
      }
      onUpdateProblems(problems.filter((p) => p.char !== preset.char));
    } else {
      onUpdateProblems([...problems, preset]);
    }
  };

  const applyPresetGroup = (group: HangulProblem[], label: string) => {
    onUpdateProblems([...group]);
    showToast(`${label} (${group.length}개) 문제로 설정되었어요!`);
  };

  const handleShuffle = () => {
    const shuffled = [...problems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    onUpdateProblems(shuffled);
    showToast('문제 순서가 골고루 섞였어요!');
  };

  const handleAddCustomProblem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedChar = customChar.trim();
    if (!trimmedChar) return;

    const defaultPrompt = `${trimmedChar}${getKoreanParticle(trimmedChar)} 만드세요!`;
    const finalPrompt = customPrompt.trim() || defaultPrompt;

    const newProblem: HangulProblem = {
      id: `custom-${Date.now()}`,
      char: trimmedChar,
      name: customName.trim() || trimmedChar,
      category: 'custom',
      customPrompt: finalPrompt,
      bodyTip:
        customTip.trim() ||
        `친구들과 힘을 합쳐 몸으로 멋지게 '${trimmedChar}' 모양을 만들어 보아요!`,
      exampleWord: '우리 반 특별 문제',
    };

    onUpdateProblems([...problems, newProblem]);
    setCustomChar('');
    setCustomPrompt('');
    setCustomName('');
    setCustomTip('');
    showToast(`'${finalPrompt}' 문제가 목록에 추가되었어요!`);
  };

  const startEditingProblem = (prob: HangulProblem) => {
    setEditingId(prob.id);
    setEditChar(prob.char);
    setEditPrompt(
      prob.customPrompt || formatPromptText(prob.char, settings.promptTemplate)
    );
    setEditName(prob.name);
    setEditTip(prob.bodyTip);
  };

  const saveEditedProblem = (id: string) => {
    const trimmedChar = editChar.trim();
    if (!trimmedChar) return;

    const updated = problems.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        char: trimmedChar,
        customPrompt:
          editPrompt.trim() ||
          `${trimmedChar}${getKoreanParticle(trimmedChar)} 만드세요!`,
        name: editName.trim() || trimmedChar,
        bodyTip: editTip.trim() || p.bodyTip,
      };
    });

    onUpdateProblems(updated);
    setEditingId(null);
    showToast('문제 문구가 수정되었어요!');
  };

  const handleMoveItem = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= problems.length) return;
    const copy = [...problems];
    [copy[index], copy[targetIdx]] = [copy[targetIdx], copy[index]];
    onUpdateProblems(copy);
  };

  const handleRemoveItem = (id: string, char: string) => {
    if (problems.length <= 1) {
      showToast('최소 1개 이상의 문제가 남아있어야 해요!');
      return;
    }
    onUpdateProblems(problems.filter((p) => p.id !== id));
    showToast(`'${char}' 문제를 목록에서 뺐어요.`);
  };

  const renderSectionGrid = (title: string, subtitle: string, items: HangulProblem[]) => {
    const allSelected = items.every((item) => activeChars.has(item.char));

    const handleToggleSectionAll = () => {
      if (allSelected) {
        const remaining = problems.filter((p) => !items.some((i) => i.char === p.char));
        if (remaining.length === 0) {
          showToast('최소 1개 이상의 문제가 필요해요!');
          return;
        }
        onUpdateProblems(remaining);
      } else {
        const missing = items.filter((item) => !activeChars.has(item.char));
        onUpdateProblems([...problems, ...missing]);
      }
    };

    return (
      <div className="bg-amber-50/70 border-2 border-amber-200/80 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h4 className="text-lg font-bold text-amber-950">{title}</h4>
            <p className="text-sm text-amber-800/80">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleToggleSectionAll}
            className="px-3.5 py-1.5 rounded-xl text-sm font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {allSelected ? '모두 해제' : '모두 선택'}
          </button>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
          {items.map((item) => {
            const isSelected = activeChars.has(item.char);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleProblem(item)}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-sm scale-[1.02]'
                    : 'bg-white border-amber-200/80 text-stone-400 hover:border-amber-300 hover:text-stone-600'
                }`}
              >
                <span className="text-2xl font-bold leading-none">{item.char}</span>
                <span className="text-xs mt-1 font-normal opacity-85">{item.name}</span>
                {isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="bg-[#FFFDF7] border-4 border-amber-400 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-pop-scale">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-300/90 border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-2xl font-bold text-amber-600 shadow-xs">
              가
            </span>
            <div>
              <h2 id="settings-modal-title" className="text-2xl font-bold text-amber-950">
                선생님 문제 &amp; 교실 설정
              </h2>
              <p className="text-sm text-amber-900">
                현재 선택된 문제: 총 {problems.length}개 · 클릭해서 마음대로 바꾸세요!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-bold border-2 border-amber-500 shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="w-5 h-5" />
            <span>닫기</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-3 bg-amber-100/80 border-b border-amber-200 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('letters')}
              className={`px-4 py-2 rounded-xl text-base font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'letters'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-amber-950 hover:bg-amber-200/60'
              }`}
            >
              자음 · 모음 고르기
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 rounded-xl text-base font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'custom'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-amber-950 hover:bg-amber-200/60'
              }`}
            >
              직접 문제 추가 · 문구 수정 ({problems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('options')}
              className={`px-4 py-2 rounded-xl text-base font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'options'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-amber-950 hover:bg-amber-200/60'
              }`}
            >
              교실 화면 설정
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-4 h-4" />
              <span>문제 순서 섞기</span>
            </button>
          </div>
        </div>

        {/* Toast banner if present */}
        {feedbackMsg && (
          <div className="bg-emerald-600 text-white px-6 py-2 text-center text-sm font-bold">
            {feedbackMsg}
          </div>
        )}

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'letters' && (
            <>
              {/* Quick Preset Bar */}
              <div className="bg-white border-2 border-amber-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-base font-bold text-stone-800">
                    빠른 문제 묶음 선택 (클릭하면 바로 적용돼요)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetGroup(BASIC_CONSONANTS, '기본 자음 14개')}
                    className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-sm font-bold border border-amber-300 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    기본 자음만 (ㄱ~ㅎ 14개)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetGroup(BASIC_VOWELS, '기본 모음 10개')}
                    className="px-3.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-950 text-sm font-bold border border-sky-300 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    기본 모음만 (ㅏ~ㅣ 10개)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPresetGroup(
                        [...BASIC_CONSONANTS, ...BASIC_VOWELS],
                        '기본 자음 + 모음 24개'
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-sm font-bold border border-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    자음 + 모음 기본 (24개)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyPresetGroup(
                        [...BASIC_CONSONANTS, ...DOUBLE_CONSONANTS, ...BASIC_VOWELS, ...COMPOUND_VOWELS],
                        '모든 자음 + 쌍자음 + 모든 모음'
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-950 text-sm font-bold border border-rose-300 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    쌍자음 · 복합모음까지 전체 (38개)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetGroup(ALL_PRESET_PROBLEMS, '전체 글자 및 단어')}
                    className="px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-sm font-bold border border-purple-300 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    쉬운 단어까지 모두 포함 ({ALL_PRESET_PROBLEMS.length}개)
                  </button>
                </div>
              </div>

              {renderSectionGrid(
                '기본 자음 (14개)',
                'ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ',
                BASIC_CONSONANTS
              )}

              {renderSectionGrid(
                '기본 모음 (10개)',
                'ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ',
                BASIC_VOWELS
              )}

              {renderSectionGrid(
                '쌍자음 (5개) · 친구와 둘이서 만들어요!',
                'ㄲ, ㄸ, ㅃ, ㅆ, ㅉ',
                DOUBLE_CONSONANTS
              )}

              {renderSectionGrid(
                '복합 모음 (9개)',
                'ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅚ, ㅝ, ㅟ, ㅢ',
                COMPOUND_VOWELS
              )}

              {renderSectionGrid(
                '유치원 쉬운 글자 · 모양 (6개)',
                '친구들과 모둠으로 함께 만들기 좋은 글자예요',
                FUN_WORDS
              )}
            </>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6">
              {/* 1. Add Custom Hangul Problem Form (with direct prompt text editing!) */}
              <form
                onSubmit={handleAddCustomProblem}
                className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-amber-950">
                    새로운 한글 문제 &amp; 문구 직접 추가하기
                  </h3>
                </div>
                <p className="text-sm text-stone-600">
                  문제 글자와 화면 상단에 나타날 질문 문구(예: &ldquo;ㄱ을 만드세요!&rdquo;, &ldquo;친구와 함께 하트를 만들어요!&rdquo;)를 마음대로 입력해 추가할 수 있어요.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      문제 글자 (필수)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={customChar}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomChar(val);
                        if (val.trim()) {
                          setCustomPrompt(
                            `${val.trim()}${getKoreanParticle(val.trim())} 만드세요!`
                          );
                        } else {
                          setCustomPrompt('');
                        }
                      }}
                      placeholder="예: ㄱ, 사랑, 햇님"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-amber-300 text-lg font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      상단 문제 문구 (마음대로 수정 가능)
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={
                        customChar.trim()
                          ? `${customChar.trim()}${getKoreanParticle(customChar.trim())} 만드세요!`
                          : '예: ㄱ을 만드세요! / 몸으로 ㄱ을 만들어요!'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-amber-300 text-base font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      읽기 이름 (선택)
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="예: 기역, 사랑해요"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-amber-200 text-base text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-12">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      아래쪽 설명 / 몸으로 표현 팁 문구 (선택)
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                      placeholder="예: 두 팔을 옆으로 쭉 뻗어 멋지게 표현해요!"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-amber-200 text-base text-stone-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
                  <span className="text-sm text-amber-950">
                    화면 상단 표시 미리보기:{' '}
                    <strong className="text-base text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300">
                      {customPrompt.trim() ||
                        (customChar.trim()
                          ? `${customChar.trim()}${getKoreanParticle(customChar.trim())} 만드세요!`
                          : 'ㄱ을 만드세요!')}
                    </strong>
                  </span>
                  <button
                    type="submit"
                    disabled={!customChar.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                    <span>문제 추가하기</span>
                  </button>
                </div>
              </form>

              {/* 2. Global Question Template Quick Changer */}
              <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-base font-bold text-stone-900">
                      전체 문제 기본 질문 문구 한 번에 바꾸기
                    </h4>
                    <p className="text-xs text-stone-500">
                      <code>{'{글자}'}</code> 자리에 각 한글이 들어가고 받침(을/를)이 자동으로 바뀌어요.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={settings.promptTemplate}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, promptTemplate: e.target.value })
                    }
                    className="flex-1 px-3.5 py-2 rounded-xl bg-amber-50 border-2 border-amber-300 text-base font-bold text-stone-900"
                  />
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {[
                      '{글자}을(를) 만드세요!',
                      '몸으로 {글자}을(를) 만드세요!',
                      '친구와 함께 {글자} 모양을 만들어요!',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ ...settings, promptTemplate: preset })
                        }
                        className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {preset.replace('{글자}을(를)', 'ㄱ을').replace('{글자}', 'ㄱ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Active Problem Queue List with Individual Text Edit ("문구 수정") */}
              <div className="bg-white border-2 border-amber-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-stone-900">
                      현재 출제 순서 및 개별 문구 수정 ({problems.length}개)
                    </h4>
                    <p className="text-sm text-stone-500">
                      각 문제의 <strong>[문구 수정]</strong> 버튼을 누르면 질문 문장과 팁을 개별적으로 고칠 수 있어요!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      applyPresetGroup(
                        [...BASIC_CONSONANTS, ...BASIC_VOWELS],
                        '기본 자음 + 모음 24개'
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>기본값으로 초기화</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {problems.map((prob, idx) => {
                    const isEditing = editingId === prob.id;
                    const displayedPrompt =
                      prob.customPrompt && prob.customPrompt.trim()
                        ? prob.customPrompt.trim()
                        : formatPromptText(prob.char, settings.promptTemplate);

                    if (isEditing) {
                      return (
                        <div
                          key={prob.id}
                          className="p-4 rounded-2xl bg-amber-100/90 border-2 border-amber-400 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-amber-950">
                              {idx + 1}번 문제 문구 수정하기
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => saveEditedProblem(prob.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                              >
                                저장하기
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-xl bg-white text-stone-700 text-xs font-bold border border-stone-300 cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-stone-700 mb-1">
                                글자
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                value={editChar}
                                onChange={(e) => setEditChar(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-400 font-bold text-base text-stone-900"
                              />
                            </div>
                            <div className="sm:col-span-5">
                              <label className="block text-xs font-bold text-stone-700 mb-1">
                                상단 질문 문구
                              </label>
                              <input
                                type="text"
                                maxLength={40}
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-400 font-bold text-base text-stone-900"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-stone-700 mb-1">
                                읽기 이름
                              </label>
                              <input
                                type="text"
                                maxLength={12}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm text-stone-900"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-xs font-bold text-stone-700 mb-1">
                                표현 팁 문구
                              </label>
                              <input
                                type="text"
                                maxLength={60}
                                value={editTip}
                                onChange={(e) => setEditTip(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-sm text-stone-900"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={prob.id}
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-amber-800 w-6 text-center tabular-nums">
                            {idx + 1}.
                          </span>
                          <span className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 font-bold text-xl flex items-center justify-center shrink-0">
                            {prob.char}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-stone-900 truncate">
                              {displayedPrompt}{' '}
                              <span className="text-xs font-normal text-stone-500">
                                ({prob.name})
                              </span>
                            </div>
                            <div className="text-xs text-stone-500 truncate">{prob.bodyTip}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditingProblem(prob)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-200/70 text-amber-950 border border-amber-300 text-xs font-bold cursor-pointer whitespace-nowrap"
                            title="이 문제의 문구 수정하기"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>문구 수정</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg hover:bg-amber-200/70 disabled:opacity-30 text-stone-700 cursor-pointer"
                            title="위로 이동"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, 1)}
                            disabled={idx === problems.length - 1}
                            className="p-1.5 rounded-lg hover:bg-amber-200/70 disabled:opacity-30 text-stone-700 cursor-pointer"
                            title="아래로 이동"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(prob.id, prob.char)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-5">
              {/* Top Question Text Template */}
              <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-lg font-bold text-stone-900">상단 문제 질문 문구 바꾸기</h3>
                <p className="text-sm text-stone-600">
                  상단에 표시되는 질문 문장을 바꿀 수 있어요. <code>{'{글자}'}</code> 자리에 현재 한글 문제가 들어가고 받침에 맞춰 을/를이 자동으로 붙어요.
                </p>
                <input
                  type="text"
                  value={settings.promptTemplate}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, promptTemplate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-lg font-bold text-stone-900"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    '{글자}을(를) 만드세요!',
                    '몸으로 {글자}을(를) 만드세요!',
                    '친구와 함께 {글자} 모양을 만들어요!',
                    '하나 둘 셋! {글자}을(를) 만들어 볼까요?',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...settings, promptTemplate: preset })
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {preset.replace('{글자}을(를)', 'ㄱ을').replace('{글자}', 'ㄱ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Name Label for Photo Frame */}
              <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 space-y-2">
                <h3 className="text-lg font-bold text-stone-900">유치원 · 반 이름표 설정</h3>
                <p className="text-sm text-stone-600">
                  사진을 찍어 저장할 때 사진 하단 이름표에 들어갈 반 이름이에요.
                </p>
                <input
                  type="text"
                  maxLength={20}
                  value={settings.classNameLabel}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, classNameLabel: e.target.value })
                  }
                  placeholder="예: 해바라기반 · 몸으로 만들어요 한글"
                  className="w-full px-4 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-base font-bold text-stone-900"
                />
              </div>

              {/* Classroom Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      autoPhotoOnSuccess: !settings.autoPhotoOnSuccess,
                    })
                  }
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    settings.autoPhotoOnSuccess
                      ? 'bg-emerald-50 border-emerald-400'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      settings.autoPhotoOnSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-stone-900">
                      &lsquo;성공&rsquo; 버튼을 누를 때 자동 사진 촬영
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      오른쪽 아래 성공 버튼을 누르면 자동으로 사진을 찍고 다음 문제로 넘어가요.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      addPhotoFrame: !settings.addPhotoFrame,
                    })
                  }
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    settings.addPhotoFrame
                      ? 'bg-emerald-50 border-emerald-400'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      settings.addPhotoFrame
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-stone-900">
                      사진에 귀여운 유치원 한글 액자 넣기
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      찍은 사진 속에 만든 글자(ㄱ, ㄴ...)와 반 이름표를 예쁘게 함께 기록해요.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-amber-100/70 border-t border-amber-200 flex items-center justify-between">
          <span className="text-sm text-stone-600">
            설정한 내용은 자동으로 저장되어 다음 수업 시간에도 그대로 유지돼요.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-lg font-bold shadow-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            설정 완료 · 놀이 시작!
          </button>
        </div>
      </div>
    </div>
  );
};
