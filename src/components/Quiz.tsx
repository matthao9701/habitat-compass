import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CompassMark from './CompassMark';
import {
  mbtiQuestions,
  lifestyleQuestions,
  type MBTIQuestion,
  type LifestyleQuestion,
} from '../data/questions';
import { interestTags } from '../data/interests';
import type { UserAnswers, Choice } from '../lib/engine';

// ---------------------------------------------------------------------------
// 页面模型
// ---------------------------------------------------------------------------

type PageItem =
  | { kind: 'mbti'; question: MBTIQuestion }
  | { kind: 'lifestyle'; question: LifestyleQuestion }
  | { kind: 'interests'; ids: string[] };

interface Page {
  module: 'mbti' | 'lifestyle' | 'interests';
  eyebrow: string;
  items: PageItem[];
}

const MBTI_CHUNK = 4;
const LIFESTYLE_CHUNK = 4;
const INTEREST_CHUNK = 8;

function buildPages(): Page[] {
  const pages: Page[] = [];

  for (let i = 0; i < mbtiQuestions.length; i += MBTI_CHUNK) {
    pages.push({
      module: 'mbti',
      eyebrow: `PART 01 · 人格倾向 MBTI`,
      items: mbtiQuestions
        .slice(i, i + MBTI_CHUNK)
        .map((question) => ({ kind: 'mbti' as const, question })),
    });
  }

  for (let i = 0; i < lifestyleQuestions.length; i += LIFESTYLE_CHUNK) {
    pages.push({
      module: 'lifestyle',
      eyebrow: 'PART 02 · 生活偏好',
      items: lifestyleQuestions
        .slice(i, i + LIFESTYLE_CHUNK)
        .map((question) => ({ kind: 'lifestyle' as const, question })),
    });
  }

  for (let i = 0; i < interestTags.length; i += INTEREST_CHUNK) {
    pages.push({
      module: 'interests',
      eyebrow: 'PART 03 · 兴趣爱好（多选）',
      items: [{ kind: 'interests', ids: interestTags.slice(i, i + INTEREST_CHUNK).map((t) => t.id) }],
    });
  }

  return pages;
}

const TOTAL_ANSWERABLE =
  mbtiQuestions.length + lifestyleQuestions.length + interestTags.length;

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

interface QuizProps {
  onComplete: (answers: UserAnswers) => void;
  onExit: () => void;
}

export default function Quiz({ onComplete, onExit }: QuizProps) {
  const pages = useMemo(buildPages, []);
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<UserAnswers>({
    mbti: {},
    lifestyle: {},
    interests: [],
  });

  const page = pages[pageIndex];
  const isLast = pageIndex === pages.length - 1;

  const answeredCount =
    Object.keys(answers.mbti).length +
    Object.keys(answers.lifestyle).length +
    answers.interests.length;
  const progress = Math.round((answeredCount / TOTAL_ANSWERABLE) * 100);

  // 当前页是否全部作答（兴趣页允许 0 选择，因此始终可通过）
  const pageReady = page.items.every((item) => {
    if (item.kind === 'mbti') return Boolean(answers.mbti[item.question.id]);
    if (item.kind === 'lifestyle') return Boolean(answers.lifestyle[item.question.id]);
    return true;
  });

  function setMBTIAnswer(id: string, choice: Choice): void {
    setAnswers((prev) => ({ ...prev, mbti: { ...prev.mbti, [id]: choice } }));
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
      {/* 顶栏 + 进度 */}
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
        <div className="h-[3px] w-full bg-ink/10">
          <motion.div
            className="h-full bg-clay"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </header>

      {/* 题目区 */}
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
            <p className="eyebrow mb-2">{page.eyebrow}</p>
            <div className="mb-8 mt-3 flex items-center gap-4">
              <div className="h-px flex-1 bg-ink/15" />
              <p className="font-mono text-[10px] text-ink-soft">
                {page.module === 'interests' ? 'MULTI-SELECT' : 'CHOOSE ONE'}
              </p>
            </div>

            <div className="space-y-7">
              {page.items.map((item) => {
                if (item.kind === 'mbti') {
                  return (
                    <MBTIItem
                      key={item.question.id}
                      question={item.question}
                      value={answers.mbti[item.question.id]}
                      onSelect={(choice) => setMBTIAnswer(item.question.id, choice)}
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
// MBTI 二选一
// ---------------------------------------------------------------------------

interface MBTIItemProps {
  question: MBTIQuestion;
  value?: Choice;
  onSelect: (choice: Choice) => void;
}

function MBTIItem({ question, value, onSelect }: MBTIItemProps) {
  return (
    <div>
      <p className="mb-3 font-serif text-[17px] font-medium leading-relaxed md:text-lg">
        {question.scenario}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {(['a', 'b'] as const).map((choice) => {
          const text = choice === 'a' ? question.a.text : question.b.text;
          const selected = value === choice;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onSelect(choice)}
              data-selected={selected}
              className="chip-choice group flex items-start gap-3 !py-4"
            >
              <span
                className={`mt-0.5 font-mono text-[11px] transition-colors ${
                  selected ? 'text-clay' : 'text-ink-soft group-hover:text-ink'
                }`}
              >
                {choice.toUpperCase()}
              </span>
              <span className="text-[14px] leading-[1.7]">{text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 生活偏好单选
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
