import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CompassMark from './CompassMark';
import {
  mbtiQuestions,
  lifestyleQuestions,
  MBTI_SOURCE,
  type MBTIQuestion,
  type LifestyleQuestion,
} from '../data/questions';
import { interestTags } from '../data/interests';
import type { UserAnswers } from '../lib/engine';
import * as storage from '../lib/storage';

/** 草稿恢复：跳到第一个含未答题的数据页 */
function firstIncompletePage(pages: Page[], draft: UserAnswers | null): number {
  if (!draft) return 0;
  const idx = pages.findIndex((p) => {
    if (p.kind === 'transition') return false;
    return p.items.some((item) => {
      if (item.kind === 'mbti') return typeof draft.mbti[item.question.id] !== 'number';
      if (item.kind === 'lifestyle') return !draft.lifestyle[item.question.id];
      return false;
    });
  });
  return idx === -1 ? 0 : idx;
}

// ---------------------------------------------------------------------------
// 页面模型：数据页 + 阶段过渡引导页
// ---------------------------------------------------------------------------

type ModuleId = 'mbti' | 'lifestyle' | 'interests';

type PageItem =
  | { kind: 'mbti'; question: MBTIQuestion }
  | { kind: 'lifestyle'; question: LifestyleQuestion }
  | { kind: 'interests'; ids: string[] };

type DataPage = {
  kind: 'data';
  module: ModuleId;
  eyebrow: string;
  items: PageItem[];
  /** 数据页序号（0..11），用于分段进度计算 */
  dataPageNo: number;
};

type TransitionPage = { kind: 'transition'; to: 'lifestyle' | 'interests' };

type Page = DataPage | TransitionPage;

const MBTI_CHUNK = 4;
const LIFESTYLE_CHUNK = 4;
const INTEREST_CHUNK = 8;

function buildPages(): Page[] {
  const pages: Page[] = [];
  let dataPageNo = 0;

  for (let i = 0; i < mbtiQuestions.length; i += MBTI_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'mbti',
      eyebrow: `STAGE 01 · 人格倾向 MBTI（七级量表）`,
      dataPageNo: dataPageNo++,
      items: mbtiQuestions
        .slice(i, i + MBTI_CHUNK)
        .map((question) => ({ kind: 'mbti' as const, question })),
    });
  }

  pages.push({ kind: 'transition', to: 'lifestyle' });

  for (let i = 0; i < lifestyleQuestions.length; i += LIFESTYLE_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'lifestyle',
      eyebrow: `STAGE 02 · 生活偏好（情景选择）`,
      dataPageNo: dataPageNo++,
      items: lifestyleQuestions
        .slice(i, i + LIFESTYLE_CHUNK)
        .map((question) => ({ kind: 'lifestyle' as const, question })),
    });
  }

  pages.push({ kind: 'transition', to: 'interests' });

  for (let i = 0; i < interestTags.length; i += INTEREST_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'interests',
      eyebrow: `STAGE 03 · 兴趣爱好（多选）`,
      dataPageNo: dataPageNo++,
      items: [
        { kind: 'interests', ids: interestTags.slice(i, i + INTEREST_CHUNK).map((t) => t.id) },
      ],
    });
  }

  return pages;
}

const TRANSITION_META = {
  lifestyle: {
    no: '02',
    title: '生活偏好',
    desc: '接下来是 8 道情景选择题：预算、气候、节奏、社交与远程办公——把你的生活方式描摹出来。',
    remaining: '8 题 · 约 2 分钟',
  },
  interests: {
    no: '03',
    title: '兴趣爱好',
    desc: '最后一站：从 16 个兴趣标签里勾选你真实想做的。它们会直接影响城市与你的契合度。',
    remaining: '16 个标签 · 约 1 分钟',
  },
} as const;

const PHASE_LABEL: Record<ModuleId, string> = {
  mbti: '人格 MBTI',
  lifestyle: '生活偏好',
  interests: '兴趣爱好',
};

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

interface QuizProps {
  onComplete: (answers: UserAnswers) => void;
  onExit: () => void;
}

export default function Quiz({ onComplete, onExit }: QuizProps) {
  const pages = useMemo(buildPages, []);
  const [draft, setDraft] = useState<UserAnswers | null>(() => storage.loadDraft());
  const [pageIndex, setPageIndex] = useState(() => firstIncompletePage(pages, draft));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<UserAnswers>(
    () => draft ?? { mbti: {}, lifestyle: {}, interests: [] },
  );

  const page = pages[pageIndex];
  const isLast = pageIndex === pages.length - 1;
  const dataPages = useMemo(
    () => pages.filter((p): p is DataPage => p.kind === 'data'),
    [pages],
  );

  const answeredCount =
    Object.keys(answers.mbti).length +
    Object.keys(answers.lifestyle).length +
    answers.interests.length;
  const totalAnswerable = mbtiQuestions.length + lifestyleQuestions.length + interestTags.length;
  const progress = Math.round((answeredCount / totalAnswerable) * 100);

  // 当前页是否全部作答（兴趣页允许 0 选择，因此始终可通过）
  const pageReady = page.kind === 'transition' || page.items.every((item) => {
    if (item.kind === 'mbti') return typeof answers.mbti[item.question.id] === 'number';
    if (item.kind === 'lifestyle') return Boolean(answers.lifestyle[item.question.id]);
    return true;
  });

  // ---- 草稿自动保存（中途退出后可恢复） ----
  useEffect(() => {
    const hasAny =
      Object.keys(answers.mbti).length > 0 ||
      Object.keys(answers.lifestyle).length > 0 ||
      answers.interests.length > 0;
    if (hasAny) storage.saveDraft(answers);
  }, [answers]);

  function resetDraft(): void {
    storage.clearDraft();
    setDraft(null);
    setAnswers({ mbti: {}, lifestyle: {}, interests: [] });
    setPageIndex(0);
    setDirection(1);
  }

  // ---- 分段进度：每个阶段的填充比例 ----
  const currentDataPageNo =
    page.kind === 'data' ? page.dataPageNo : dataPages.length; // 过渡页视为“上一阶段已完结”
  const phaseFill = (module: ModuleId): number => {
    const ofPhase = dataPages.filter((p) => p.module === module);
    const passed = ofPhase.filter((p) => {
      if (p.dataPageNo < currentDataPageNo) return true;
      return (
        p.dataPageNo === currentDataPageNo && page.kind === 'data' && pageReady
      );
    }).length;
    return ofPhase.length === 0 ? 0 : passed / ofPhase.length;
  };
  const activePhase: ModuleId | null =
    page.kind === 'data' ? page.module : null;

  function setMBTIAnswer(id: string, value: number): void {
    setAnswers((prev) => ({ ...prev, mbti: { ...prev.mbti, [id]: value } }));
  }

  function setLifestyleAnswer(id: string, value: string): void {
    setAnswers((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [id]: value },
    }));
  }

  function toggleInterest(id: string): void {
    setAnswers((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((t) => t !== id)
        : [...prev.interests, id],
    }));
  }

  function goNext(): void {
    if (!pageReady) return;
    if (isLast) {
      onComplete(answers);
      return;
    }
    setDirection(1);
    setPageIndex((i) => i + 1);
  }

  function goBack(): void {
    if (pageIndex === 0) {
      onExit();
      return;
    }
    setDirection(-1);
    setPageIndex((i) => i - 1);
  }

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
  };

  return (
    <div className="grain flex min-h-screen flex-col bg-paper text-ink">
      {/* 顶栏 + 分段进度 */}
      <header className="border-b hairline">
        <div className="mx-auto flex max-w-[860px] items-center justify-between px-6 py-5 md:px-8">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-2.5 text-ink"
          >
            <CompassMark size={26} />
            <span className="font-serif text-[15px] font-semibold tracking-wide">NomadMatch</span>
          </button>
          <p className="font-mono text-[11px] text-ink-soft">
            {String(pageIndex + 1).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}
          </p>
        </div>
        {/* 草稿恢复提示 */}
        {draft && (
          <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3 px-6 pt-3 md:px-8">
            <p className="font-mono text-[10.5px] text-ochre">
              已恢复上次答题进度（
              {Object.keys(draft.mbti).length +
                Object.keys(draft.lifestyle).length +
                draft.interests.length}{' '}
              / {totalAnswerable}）
            </p>
            <button
              type="button"
              onClick={resetDraft}
              className="font-mono text-[10.5px] text-ink-soft underline underline-offset-2 transition-colors hover:text-clay"
            >
              清空重答
            </button>
          </div>
        )}
        {/* 三段式进度条 */}
        <div className="mx-auto max-w-[860px] px-6 md:px-8">
          <div className="flex gap-[3px]">
            {(['mbti', 'lifestyle', 'interests'] as ModuleId[]).map((module) => {
              const pagesOfPhase = dataPages.filter((p) => p.module === module).length;
              const fill = phaseFill(module);
              const isActive = activePhase === module;
              return (
                <div
                  key={module}
                  className="relative h-[3px] bg-ink/10"
                  style={{ width: `${(pagesOfPhase / dataPages.length) * 100}%` }}
                >
                  <motion.div
                    className={`h-full ${isActive ? 'bg-clay' : 'bg-pine'}`}
                    initial={false}
                    animate={{ width: `${Math.round(fill * 100)}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-[3px] pb-3">
            {(['mbti', 'lifestyle', 'interests'] as ModuleId[]).map((module) => {
              const pagesOfPhase = dataPages.filter((p) => p.module === module).length;
              const isActive = activePhase === module;
              const done = phaseFill(module) >= 1;
              return (
                <p
                  key={module}
                  style={{ width: `${(pagesOfPhase / dataPages.length) * 100}%` }}
                  className={`truncate font-mono text-[9px] uppercase tracking-wider transition-colors ${
                    isActive ? 'text-clay' : done ? 'text-pine' : 'text-ink-soft/60'
                  }`}
                >
                  {PHASE_LABEL[module]}
                </p>
              );
            })}
          </div>
        </div>
      </header>

      {/* 页面主体 */}
      <main className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-6 py-8 md:px-8 md:py-12">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={pageIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            {page.kind === 'transition' ? (
              <TransitionStage to={page.to} />
            ) : (
              <>
                <p className="eyebrow mb-2">{page.eyebrow}</p>
                <div className="mb-8 mt-3 flex items-center gap-4">
                  <div className="h-px flex-1 bg-ink/15" />
                  <p className="font-mono text-[10px] text-ink-soft">
                    {page.module === 'interests' ? 'MULTI-SELECT' : 'CHOOSE ONE'}
                  </p>
                </div>

                <div className="space-y-6">
                  {page.items.map((item) => {
                    if (item.kind === 'mbti') {
                      return (
                        <MBTIItem
                          key={item.question.id}
                          question={item.question}
                          value={answers.mbti[item.question.id]}
                          onSelect={(value) => setMBTIAnswer(item.question.id, value)}
                        />
                      );
                    }
                    if (item.kind === 'lifestyle') {
                      return (
                        <LifestyleItem
                          key={item.question.id}
                          question={item.question}
                          value={answers.lifestyle[item.question.id]}
                          onSelect={(v) => setLifestyleAnswer(item.question.id, v)}
                        />
                      );
                    }
                    return (
                      <InterestItem
                        key="interests"
                        ids={item.ids}
                        selected={answers.interests}
                        onToggle={toggleInterest}
                      />
                    );
                  })}
                </div>

                {page.module === 'mbti' && page.dataPageNo === 0 && (
                  <p className="mt-8 font-mono text-[9.5px] leading-relaxed text-ink-soft/80">
                    量表结构基于 {MBTI_SOURCE.base}（{MBTI_SOURCE.publisher}），
                    以 {MBTI_SOURCE.license} 许可改编译制，非商业使用。
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 底部导航 */}
      <footer className="sticky bottom-0 border-t hairline bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-4 px-6 py-4 md:px-8">
          <button type="button" onClick={goBack} className="btn-ghost !px-5 !py-3 text-sm">
            <span className="font-mono text-xs">←</span>
            {pageIndex === 0 ? '返回首页' : '上一步'}
          </button>
          <p className="hidden font-mono text-[10px] text-ink-soft sm:block">
            {progress}% COMPLETE
          </p>
          <button type="button" onClick={goNext} disabled={!pageReady} className="btn-clay !px-7 !py-3 text-sm">
            {isLast ? '生成我的报告' : '继续'}
            <span className="font-mono text-xs opacity-80">→</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 阶段过渡引导页
// ---------------------------------------------------------------------------

function TransitionStage({ to }: { to: 'lifestyle' | 'interests' }) {
  const meta = TRANSITION_META[to];
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-14 text-center md:py-20">
      <div className="mb-6 flex items-center gap-3 text-ink-soft">
        <span className="h-px w-10 bg-ink/20" />
        <CompassMark size={30} />
        <span className="h-px w-10 bg-ink/20" />
      </div>
      <p className="eyebrow">stage {meta.no} / 03 · 即将开始</p>
      <h2 className="mt-4 font-serif text-3xl font-medium md:text-4xl">{meta.title}</h2>
      <p className="mt-5 max-w-md text-[14px] leading-[1.9] text-ink-soft">{meta.desc}</p>
      <p className="mt-6 rounded-full border hairline px-4 py-1.5 font-mono text-[10.5px] text-ink-soft">
        还剩 {meta.remaining}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MBTI 七级双极量表
// ---------------------------------------------------------------------------

const SCALE = [1, 2, 3, 4, 5, 6, 7] as const;

interface MBTIItemProps {
  question: MBTIQuestion;
  value?: number;
  onSelect: (value: number) => void;
}

function MBTIItem({ question, value, onSelect }: MBTIItemProps) {
  const leftActive = typeof value === 'number' && value < 4;
  const rightActive = typeof value === 'number' && value > 4;
  return (
    <div className="rounded-[8px] border hairline bg-card/70 px-4 py-5 md:px-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p
          className={`max-w-[47%] text-[13.5px] leading-[1.65] transition-colors ${
            leftActive ? 'font-medium text-ink' : 'text-ink-soft'
          }`}
        >
          {question.left.text}
        </p>
        <p
          className={`max-w-[47%] text-right text-[13.5px] leading-[1.65] transition-colors ${
            rightActive ? 'font-medium text-ink' : 'text-ink-soft'
          }`}
        >
          {question.right.text}
        </p>
      </div>

      <div className="flex items-center justify-between gap-1 md:gap-1.5">
        {SCALE.map((v) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              aria-label={`左侧「${question.left.text}」到右侧「${question.right.text}」的符合程度：${v} / 7`}
              onClick={() => onSelect(v)}
              data-selected={selected}
              className={`h-8 w-8 shrink-0 rounded-[7px] border font-mono text-[11px] transition-all duration-200 active:scale-95 md:h-9 md:w-9 ${
                selected
                  ? 'border-clay bg-clay text-paper shadow-[0_2px_10px_rgba(190,90,56,0.35)]'
                  : 'border-ink/20 bg-transparent text-ink-soft hover:border-ink/50 hover:text-ink'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-ink-soft/70">
        <span>完全符合左</span>
        <span>4 · 中立</span>
        <span>完全符合右</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 生活偏好单选（情景选择题）
// ---------------------------------------------------------------------------

interface LifestyleItemProps {
  question: LifestyleQuestion;
  value?: string;
  onSelect: (value: string) => void;
}

function LifestyleItem({ question, value, onSelect }: LifestyleItemProps) {
  return (
    <div>
      <p className="mb-1 font-serif text-[17px] font-medium leading-relaxed md:text-lg">
        {question.title}
      </p>
      {question.hint && (
        <p className="mb-4 font-mono text-[10.5px] text-ink-soft">{question.hint}</p>
      )}
      <div className={`grid gap-2.5 ${question.options.length > 3 ? 'md:grid-cols-2' : ''}`}>
        {question.options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              data-selected={selected}
              className="chip-choice flex items-center justify-between gap-4 !py-3.5"
            >
              <span className="flex flex-col">
                <span className="text-[14px] font-medium">{option.label}</span>
                {option.desc && (
                  <span className="mt-0.5 text-[12px] text-ink-soft">{option.desc}</span>
                )}
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                  selected ? 'scale-100 bg-clay' : 'scale-75 bg-ink/20'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 兴趣多选
// ---------------------------------------------------------------------------

interface InterestItemProps {
  ids: string[];
  selected: string[];
  onToggle: (id: string) => void;
}

function InterestItem({ ids, selected, onToggle }: InterestItemProps) {
  return (
    <div className="grid gap-2.5 md:grid-cols-2">
      {ids.map((id) => {
        const tag = interestTags.find((t) => t.id === id);
        if (!tag) return null;
        const isSelected = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            data-selected={isSelected}
            className="chip-choice flex items-center justify-between gap-4 !py-3.5"
          >
            <span className="flex flex-col">
              <span className="text-[14px] font-medium">{tag.label}</span>
              <span className="mt-0.5 text-[12px] text-ink-soft">{tag.desc}</span>
            </span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-all ${
                isSelected ? 'border-clay bg-clay text-paper' : 'border-ink/25 text-transparent'
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6.2L4.8 9L10 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}
