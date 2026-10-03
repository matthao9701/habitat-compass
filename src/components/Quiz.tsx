import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CompassMark from './CompassMark';
import ConstraintsStep from './quiz/ConstraintsStep';
import { track, trackStage } from '../lib/telemetry';
import { hasAnyConstraint, DEFAULT_CONSTRAINTS, type HardConstraints } from '../lib/constraints';
import {
  mbtiQuestions,
  lifestyleQuestions,
  MBTI_SOURCE,
  type MBTIQuestion,
  type LifestyleQuestion,
} from '../data/questions';
import { interestTags } from '../data/interests';
import {
  ipipQuestions,
  proLifestyleQuestions,
  IPIP_SCALE,
  RANK_ORDINALS,
  type IpipQuestion,
  type ProLifestyleQuestion,
} from '../data/questionsPro';
import { interestTagsPro, interestSubs } from '../data/interestsPro';
import type { InterestTag } from '../data/interests';
import type { UserAnswers, QuizVersion } from '../lib/engine';
import * as storage from '../lib/storage';

/** 草稿恢复：跳到第一个含未答题的数据页 */
function firstIncompletePage(pages: Page[], draft: UserAnswers | null): number {
  if (!draft) return 0;
  const idx = pages.findIndex((p) => {
    if (p.kind === 'transition') return false;
    return p.items.some((item) => {
      if (item.kind === 'mbti' || item.kind === 'ipip')
        return typeof draft.mbti[item.question.id] !== 'number';
      if (item.kind === 'lifestyle' || item.kind === 'proLifestyle')
        return !draft.lifestyle[item.question.id];
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
  | { kind: 'ipip'; question: IpipQuestion }
  | { kind: 'lifestyle'; question: LifestyleQuestion }
  | { kind: 'proLifestyle'; question: ProLifestyleQuestion }
  | { kind: 'interests'; ids: string[] }
  | { kind: 'proInterests'; ids: string[] };

type DataPage = {
  kind: 'data';
  module: ModuleId;
  eyebrow: string;
  items: PageItem[];
  /** 数据页序号，用于分段进度计算 */
  dataPageNo: number;
};

type TransitionPage = { kind: 'transition'; to: 'lifestyle' | 'interests' };

type Page = DataPage | TransitionPage;

const MBTI_CHUNK = 4;
const LIFESTYLE_CHUNK = 4;
const INTEREST_CHUNK = 8;
const IPIP_CHUNK = 6;
const PRO_LIFESTYLE_CHUNK = 4;
const PRO_INTEREST_CHUNK = 10;

function buildPages(version: QuizVersion): Page[] {
  const pages: Page[] = [];
  let dataPageNo = 0;
  const isPro = version === 'pro';

  if (isPro) {
    for (let i = 0; i < ipipQuestions.length; i += IPIP_CHUNK) {
      pages.push({
        kind: 'data',
        module: 'mbti',
        eyebrow: `STAGE 01 · Big Five 人格（五级量表）`,
        dataPageNo: dataPageNo++,
        items: ipipQuestions
          .slice(i, i + IPIP_CHUNK)
          .map((question) => ({ kind: 'ipip' as const, question })),
      });
    }
  } else {
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
  }

  pages.push({ kind: 'transition', to: 'lifestyle' });

  if (isPro) {
    for (let i = 0; i < proLifestyleQuestions.length; i += PRO_LIFESTYLE_CHUNK) {
      pages.push({
        kind: 'data',
        module: 'lifestyle',
        eyebrow: `STAGE 02 · 生活偏好（混编题型）`,
        dataPageNo: dataPageNo++,
        items: proLifestyleQuestions
          .slice(i, i + PRO_LIFESTYLE_CHUNK)
          .map((question) => ({ kind: 'proLifestyle' as const, question })),
      });
    }
  } else {
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
  }

  pages.push({ kind: 'transition', to: 'interests' });

  if (isPro) {
    for (let i = 0; i < interestTagsPro.length; i += PRO_INTEREST_CHUNK) {
      pages.push({
        kind: 'data',
        module: 'interests',
        eyebrow: `STAGE 03 · 兴趣爱好（多选 + 细化）`,
        dataPageNo: dataPageNo++,
        items: [
          {
            kind: 'proInterests',
            ids: interestTagsPro.slice(i, i + PRO_INTEREST_CHUNK).map((t) => t.id),
          },
        ],
      });
    }
  } else {
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

const TRANSITION_META_PRO: TransitionMeta = {
  lifestyle: {
    no: '02',
    title: '生活偏好',
    desc: '接下来是 20 道混编题：情景选择、两难二选一、100 点权重滑杆与四选一排序，从更多角度描摹你的定居偏好。',
    remaining: '20 题 · 约 6 分钟',
  },
  interests: {
    no: '03',
    title: '兴趣爱好',
    desc: '最后一站：从 28 个兴趣标签里勾选你真实想做的，还能展开二级细化，让城市匹配更懂你。',
    remaining: '28 个标签 · 约 3 分钟',
  },
} as const;

const PHASE_LABEL: Record<ModuleId, string> = {
  mbti: '人格',
  lifestyle: '生活偏好',
  interests: '兴趣爱好',
};

/** 埋点阶段序号与名称（漏斗：1 人格 → 2 偏好 → 3 兴趣 → 4 quiz 完成） */
const STAGE_INDEX: Record<ModuleId, number> = { mbti: 1, lifestyle: 2, interests: 3 };
const STAGE_NAME: Record<ModuleId, string> = {
  mbti: 'personality',
  lifestyle: 'lifestyle',
  interests: 'interests',
};

/** 标准版偏好题是否已有效作答（滑杆需恰好配满总点数，排序需全项覆盖） */
export function proLifestyleAnswered(
  q: ProLifestyleQuestion,
  lifestyle: Record<string, string>,
): boolean {
  const v = lifestyle[q.id];
  if (!v) return false;
  if (q.kind === 'slider') {
    const parts = v.split('-').map(Number);
    return (
      parts.length === q.dims.length &&
      parts.every((p) => Number.isFinite(p) && p >= 0) &&
      parts.reduce((s, x) => s + x, 0) === q.total
    );
  }
  if (q.kind === 'rank') {
    const order = v.split('>');
    return order.length === q.items.length && q.items.every((it) => order.includes(it.value));
  }
  return Boolean(v);
}

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

interface QuizProps {
  onComplete: (answers: UserAnswers) => void;
  onExit: () => void;
  version?: QuizVersion;
}

export default function Quiz({ onComplete, onExit, version = 'lite' }: QuizProps) {
  const isPro = version === 'pro';
  const pages = useMemo(() => buildPages(version), [version]);
  const [draft, setDraft] = useState<UserAnswers | null>(() =>
    isPro ? storage.loadProDraft() : storage.loadDraft(),
  );
  const [pageIndex, setPageIndex] = useState(() => firstIncompletePage(pages, draft));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<UserAnswers>(
    () =>
      draft ?? {
        version,
        mbti: {},
        lifestyle: {},
        interests: [],
        ...(isPro ? { interestSubs: {} } : {}),
      },
  );
  // 已应用的硬性条件（第六轮）：新会话默认先展示设置步骤；有草稿进度时直接续答
  const [appliedConstraints, setAppliedConstraints] = useState<HardConstraints | null>(() =>
    storage.loadHardConstraints(),
  );
  const [stage, setStage] = useState<'constraints' | 'quiz'>(() => {
    const resumed =
      draft != null &&
      (Object.keys(draft.mbti).length > 0 ||
        Object.keys(draft.lifestyle).length > 0 ||
        draft.interests.length > 0);
    return resumed ? 'quiz' : 'constraints';
  });

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
  const totalAnswerable = isPro
    ? ipipQuestions.length + proLifestyleQuestions.length + interestTagsPro.length
    : mbtiQuestions.length + lifestyleQuestions.length + interestTags.length;
  const progress = Math.round((answeredCount / totalAnswerable) * 100);

  // 当前页是否全部作答（兴趣页允许 0 选择，因此始终可通过）
  const pageReady =
    page.kind === 'transition' ||
    page.items.every((item) => {
      if (item.kind === 'mbti' || item.kind === 'ipip')
        return typeof answers.mbti[item.question.id] === 'number';
      if (item.kind === 'lifestyle') return Boolean(answers.lifestyle[item.question.id]);
      if (item.kind === 'proLifestyle')
        return proLifestyleAnswered(item.question, answers.lifestyle);
      return true;
    });

  // ---- 草稿自动保存（中途退出后可恢复；两版分开存储） ----
  useEffect(() => {
    const hasAny =
      Object.keys(answers.mbti).length > 0 ||
      Object.keys(answers.lifestyle).length > 0 ||
      answers.interests.length > 0;
    if (!hasAny) return;
    if (isPro) storage.saveProDraft(answers);
    else storage.saveDraft(answers);
  }, [answers, isPro]);

  // ---- 续答场景（跳过硬性条件页直接恢复）：记录当前阶段开始埋点（仅一次） ----
  const stageStartedRef = useRef(false);
  useEffect(() => {
    if (stage !== 'quiz' || stageStartedRef.current) return;
    stageStartedRef.current = true;
    if (page.kind === 'data') {
      const firstOfModule = dataPages.find((p) => p.module === page.module);
      if (firstOfModule && page.dataPageNo === firstOfModule.dataPageNo) {
        trackStage('start', STAGE_INDEX[page.module], STAGE_NAME[page.module]);
      }
    }
  }, [stage, page, dataPages]);

  function resetDraft(): void {
    if (isPro) storage.clearProDraft();
    else storage.clearDraft();
    setDraft(null);
    setAnswers({
      version,
      mbti: {},
      lifestyle: {},
      interests: [],
      ...(isPro ? { interestSubs: {} } : {}),
    });
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
    setAnswers((prev) => {
      const next = prev.interests.includes(id)
        ? prev.interests.filter((t) => t !== id)
        : [...prev.interests, id];
      // 取消一级标签时同步清掉其二级选择
      const subs = { ...(prev.interestSubs ?? {}) };
      if (!next.includes(id)) delete subs[id];
      return { ...prev, interests: next, interestSubs: subs };
    });
  }

  function toggleSub(parentId: string, subId: string): void {
    setAnswers((prev) => {
      const subs = { ...(prev.interestSubs ?? {}) };
      const list = subs[parentId] ?? [];
      subs[parentId] = list.includes(subId)
        ? list.filter((s) => s !== subId)
        : [...list, subId];
      return { ...prev, interestSubs: subs };
    });
  }

  function goNext(): void {
    if (!pageReady) return;
    if (isLast) {
      onComplete(answers);
      return;
    }
    // 阶段漏斗埋点：离开某阶段最后一个数据页 = 完成；进入新阶段第一个数据页 = 开始
    if (page.kind === 'data') {
      const ofModule = dataPages.filter((p) => p.module === page.module);
      const last = ofModule[ofModule.length - 1];
      if (last && page.dataPageNo === last.dataPageNo) {
        trackStage('complete', STAGE_INDEX[page.module], STAGE_NAME[page.module]);
      }
    }
    const next = pages[pageIndex + 1];
    if (next.kind === 'data') {
      const firstOfModule = dataPages.find((p) => p.module === next.module);
      if (firstOfModule && next.dataPageNo === firstOfModule.dataPageNo) {
        trackStage('start', STAGE_INDEX[next.module], STAGE_NAME[next.module]);
      }
    }
    setDirection(1);
    setPageIndex((i) => i + 1);
  }

  /** 硬性条件：保存 → 记埋点 → 进入答题 */
  function applyConstraints(hc: HardConstraints): void {
    storage.saveHardConstraints(hc);
    setAppliedConstraints(hc);
    if (hasAnyConstraint(hc)) track('hard_constraints_used');
    enterQuiz();
  }

  /** 硬性条件：跳过（清空已存条件）→ 进入答题 */
  function skipConstraints(): void {
    storage.saveHardConstraints(DEFAULT_CONSTRAINTS);
    setAppliedConstraints(null);
    enterQuiz();
  }

  function enterQuiz(): void {
    setStage('quiz');
    const first = pages[0];
    if (first.kind === 'data') {
      trackStage('start', STAGE_INDEX[first.module], STAGE_NAME[first.module]);
    }
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
  const transitionMeta = isPro ? TRANSITION_META_PRO : TRANSITION_META;
  const pageMarker =
    isPro && page.kind === 'data' && page.items[0]?.kind === 'ipip' ? 'RATE 1-5' : null;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* 顶部进度 */}
      <header className="border-b hairline bg-paper/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[860px] px-6 pt-4 md:px-8 md:pt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CompassMark size={22} />
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                {isPro ? 'STANDARD · PRO' : 'LITE'}
              </span>
            </div>
            {stage === 'constraints' ? (
              <button
                type="button"
                onClick={onExit}
                className="font-mono text-[10px] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                ← 返回首页
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStage('constraints')}
                  className="font-mono text-[10px] text-ink-soft underline-offset-4 transition-colors hover:text-clay hover:underline"
                >
                  硬性条件{hasAnyConstraint(appliedConstraints) ? ' ✓' : ''}
                </button>
                <p className="font-mono text-[10px] text-ink-soft">
                  {answeredCount} / {totalAnswerable}
                </p>
              </div>
            )}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-clay transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
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
        {stage === 'constraints' ? (
          <ConstraintsStep
            initial={appliedConstraints}
            onApply={applyConstraints}
            onSkip={skipConstraints}
          />
        ) : (
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
              <TransitionStage to={page.to} meta={transitionMeta} />
            ) : (
              <>
                <p className="eyebrow mb-2">{page.eyebrow}</p>
                <div className="mb-8 mt-3 flex items-center gap-4">
                  <div className="h-px flex-1 bg-ink/15" />
                  <p className="font-mono text-[10px] text-ink-soft">
                    {page.items[0]?.kind === 'interests'
                      ? 'MULTI-SELECT'
                      : pageMarker ?? 'CHOOSE ONE'}
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
                    if (item.kind === 'ipip') {
                      return (
                        <IPIPItem
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
                    if (item.kind === 'proLifestyle') {
                      return (
                        <ProLifestyleItem
                          key={item.question.id}
                          question={item.question}
                          value={answers.lifestyle[item.question.id]}
                          onChange={(v) => setLifestyleAnswer(item.question.id, v)}
                        />
                      );
                    }
                    if (item.kind === 'proInterests') {
                      return (
                        <InterestItemPro
                          key="pro-interests"
                          ids={item.ids}
                          selected={answers.interests}
                          subs={answers.interestSubs ?? {}}
                          onToggle={toggleInterest}
                          onToggleSub={toggleSub}
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
                    {isPro
                      ? '人格量表译自 IPIP 国际人格项目池（公有领域），引用：IPIP (Goldberg, 1999) / IPIP-NEO 120 (Johnson, 2014)。'
                      : `量表结构基于 ${MBTI_SOURCE.base}（${MBTI_SOURCE.publisher}），以 ${MBTI_SOURCE.license} 许可改编译制，非商业使用。`}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
        )}
      </main>

      {/* 底部导航（硬性条件设置页自带 CTA，无需底部导航） */}
      {stage === 'quiz' && (
      <footer className="sticky bottom-0 border-t hairline bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-4 px-6 py-4 md:px-8">
          <button type="button" onClick={goBack} className="btn-ghost !px-5 !py-3 text-sm">
            <span className="font-mono text-xs">←</span>
            {pageIndex === 0 ? '返回首页' : '上一步'}
          </button>
          <div className="hidden items-center gap-3 sm:flex">
            {isPro && (
              <button
                type="button"
                onClick={resetDraft}
                className="font-mono text-[10px] text-ink-soft/70 underline-offset-4 hover:text-clay hover:underline"
              >
                CLEAR DRAFT
              </button>
            )}
            <p className="font-mono text-[10px] text-ink-soft">{progress}% COMPLETE</p>
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={!pageReady}
            className="btn-clay !px-7 !py-3 text-sm disabled:opacity-40"
          >
            {isLast ? '生成我的报告' : '继续'}
            <span className="font-mono text-xs opacity-80">→</span>
          </button>
        </div>
      </footer>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 阶段过渡引导页
// ---------------------------------------------------------------------------

type StageMeta = { no: string; title: string; desc: string; remaining: string };
type TransitionMeta = Record<'lifestyle' | 'interests', StageMeta>;

function TransitionStage({ to, meta }: { to: 'lifestyle' | 'interests'; meta: TransitionMeta }) {
  const m = meta[to];
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-14 text-center md:py-20">
      <div className="mb-6 flex items-center gap-3 text-ink-soft">
        <span className="h-px w-10 bg-ink/20" />
        <CompassMark size={30} />
        <span className="h-px w-10 bg-ink/20" />
      </div>
      <p className="eyebrow">stage {m.no} / 03 · 即将开始</p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
        {m.title}
      </h2>
      <p className="mt-5 max-w-md text-[14px] leading-[1.9] text-ink-soft">{m.desc}</p>
      <p className="mt-6 rounded-full border hairline px-4 py-1.5 font-mono text-[10.5px] text-ink-soft">
        还剩 {m.remaining}
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
// 标准版：IPIP-NEO 五点量表
// ---------------------------------------------------------------------------

const IPIP_SCALE_HINT: Record<number, string> = {
  1: '非常不符合',
  2: '较不符合',
  3: '不确定',
  4: '较为符合',
  5: '非常符合',
};

interface IPIPItemProps {
  question: IpipQuestion;
  value?: number;
  onSelect: (value: number) => void;
}

function IPIPItem({ question, value, onSelect }: IPIPItemProps) {
  return (
    <div className="rounded-[8px] border hairline bg-card/70 px-4 py-5 md:px-6">
      <p className="mb-4 flex items-start gap-3 text-[14px] leading-[1.75]">
        <span className="mt-0.5 shrink-0 font-mono text-[10px] text-ochre">
          {question.domain}
        </span>
        <span className="text-ink">{question.text}</span>
      </p>
      <div className="flex items-center justify-between gap-1.5 md:gap-2.5">
        {IPIP_SCALE.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={`「${question.text}」符合程度：${opt.label}`}
              onClick={() => onSelect(opt.value)}
              data-selected={selected}
              title={opt.label}
              className={`flex h-10 flex-1 items-center justify-center rounded-[7px] border font-mono text-[12px] transition-all duration-200 active:scale-95 ${
                selected
                  ? 'border-clay bg-clay text-paper shadow-[0_2px_10px_rgba(190,90,56,0.35)]'
                  : 'border-ink/20 bg-transparent text-ink-soft hover:border-ink/50 hover:text-ink'
              }`}
            >
              {opt.value}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-ink-soft/80">
        <span>{IPIP_SCALE_HINT[1]}</span>
        <span className="font-mono text-[9px]">{value ? IPIP_SCALE_HINT[value] : ''}</span>
        <span>{IPIP_SCALE_HINT[5]}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 生活偏好单选（情景选择题 · 简易版）
// ---------------------------------------------------------------------------

interface LifestyleItemProps {
  question: LifestyleQuestion;
  value?: string;
  onSelect: (value: string) => void;
}

function LifestyleItem({ question, value, onSelect }: LifestyleItemProps) {
  return (
    <div>
      <p className="mb-1 font-heading text-[17px] font-bold leading-relaxed md:text-lg">
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
// 兴趣多选（简易版）
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

// ---------------------------------------------------------------------------
// 标准版：生活偏好混编题型（choice / forced / slider / rank）
// ---------------------------------------------------------------------------

const PRO_KIND_LABEL: Record<ProLifestyleQuestion['kind'], string> = {
  choice: '情景选择',
  forced: '两难二选一',
  slider: '权重分配',
  rank: '偏好排序',
};

interface ProLifestyleItemProps {
  question: ProLifestyleQuestion;
  value?: string;
  onChange: (value: string) => void;
}

function ProLifestyleItem({ question, value, onChange }: ProLifestyleItemProps) {
  return (
    <div className="rounded-[8px] border hairline bg-card/70 px-4 py-5 md:px-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded border border-ochre/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ochre">
          {PRO_KIND_LABEL[question.kind]}
        </span>
      </div>
      <p className="mb-1 font-heading text-[16px] font-bold leading-relaxed md:text-[17px]">
        {question.title}
      </p>
      {question.hint && (
        <p className="mb-4 text-[12px] leading-relaxed text-ink-soft">{question.hint}</p>
      )}
      <ProLifestyleBody question={question} value={value} onChange={onChange} />
    </div>
  );
}

function ProLifestyleBody({
  question,
  value,
  onChange,
}: ProLifestyleItemProps) {
  // ---- 情景选择 / 强迫二选一：单选 ----
  if (question.kind === 'choice' || question.kind === 'forced') {
    const options =
      question.kind === 'choice'
        ? question.options
        : [question.left, question.right];
    return (
      <div
        className={`grid gap-2.5 ${
          question.kind === 'forced' ? 'md:grid-cols-2' : options.length > 3 ? 'md:grid-cols-2' : ''
        }`}
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              data-selected={selected}
              className={`flex items-center justify-between gap-4 rounded-[8px] border px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.985] ${
                selected
                  ? 'border-clay bg-clay/10'
                  : 'border-ink/15 bg-transparent hover:border-ink/40'
              }`}
            >
              <span className="flex flex-col">
                <span className={`text-[14px] ${selected ? 'font-medium text-ink' : 'text-ink'}`}>
                  {option.label}
                </span>
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
    );
  }

  // ---- 100 点权重滑杆（四个维度 stepper，总和须配满） ----
  if (question.kind === 'slider') {
    const q = question;
    const parts = value ? value.split('-').map(Number) : q.dims.map(() => 0);
    const sum = parts.reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);
    const full = sum === q.total;

    function setPart(index: number, next: number): void {
      const clamped = Math.max(0, Math.min(q.total, next));
      const others = [...parts];
      others[index] = clamped;
      onChange(others.join('-'));
    }

    return (
      <div>
        <div className="space-y-2.5">
          {question.dims.map((d, i) => (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[13px] text-ink">{d.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-ochre transition-all duration-300"
                  style={{ width: `${Math.min(100, (parts[i] / question.total) * 100)}%` }}
                />
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`减少 ${d.label}`}
                  onClick={() => setPart(i, parts[i] - 5)}
                  className="h-7 w-7 rounded-md border border-ink/20 font-mono text-[13px] text-ink-soft transition-colors hover:border-ink/50 hover:text-ink"
                >
                  −
                </button>
                <span className="w-10 text-center font-data text-[13px] tabular-nums text-ink">
                  {parts[i] ?? 0}
                </span>
                <button
                  type="button"
                  aria-label={`增加 ${d.label}`}
                  onClick={() => setPart(i, parts[i] + 5)}
                  className="h-7 w-7 rounded-md border border-ink/20 font-mono text-[13px] text-ink-soft transition-colors hover:border-ink/50 hover:text-ink"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <p
          className={`mt-3 font-data text-[11px] ${
            full ? 'text-pine' : 'text-clay'
          }`}
        >
          已分配 {sum} / {q.total} 点{full ? ' · 已配满' : ` · 还剩 ${q.total - sum} 点`}
        </p>
      </div>
    );
  }

  // ---- 四选一排序：上移 / 下移 ----
  const order = value ? value.split('>') : question.items.map((it) => it.value);

  function move(itemValue: string, dir: -1 | 1): void {
    const idx = order.indexOf(itemValue);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= order.length) return;
    const swapped = [...order];
    [swapped[idx], swapped[next]] = [swapped[next], swapped[idx]];
    onChange(swapped.join('>'));
  }

  return (
    <div className="space-y-2">
      {order.map((itemValue, idx) => {
        const item = question.items.find((it) => it.value === itemValue);
        if (!item) return null;
        return (
          <div
            key={itemValue}
            className="flex items-center gap-3 rounded-[8px] border border-ink/15 px-4 py-3"
          >
            <span className="font-data text-[12px] tabular-nums text-ochre">
              {idx + 1}
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium text-ink">{item.label}</span>
              {item.desc && <span className="block text-[12px] text-ink-soft">{item.desc}</span>}
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                aria-label={`上移「${item.label}」`}
                disabled={idx === 0}
                onClick={() => move(itemValue, -1)}
                className="h-7 w-7 rounded-md border border-ink/20 font-mono text-[11px] text-ink-soft transition-colors hover:border-ink/50 hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`下移「${item.label}」`}
                disabled={idx === order.length - 1}
                onClick={() => move(itemValue, 1)}
                className="h-7 w-7 rounded-md border border-ink/20 font-mono text-[11px] text-ink-soft transition-colors hover:border-ink/50 hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </span>
          </div>
        );
      })}
      <p className="font-data text-[11px] text-ink-soft">点 ↑ ↓ 调整顺序，越靠前越在意</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 标准版：兴趣 28 标签 + 二级细化
// ---------------------------------------------------------------------------

interface InterestItemProProps {
  ids: string[];
  selected: string[];
  subs: Record<string, string[]>;
  onToggle: (id: string) => void;
  onToggleSub: (parentId: string, subId: string) => void;
}

function InterestItemPro({ ids, selected, subs, onToggle, onToggleSub }: InterestItemProProps) {
  return (
    <div className="grid gap-2.5 md:grid-cols-2">
      {ids.map((id) => {
        const tag = interestTagsPro.find((t: InterestTag) => t.id === id);
        if (!tag) return null;
        const isSelected = selected.includes(id);
        const subItems = interestSubs[id] ?? [];
        const chosenSubs = subs[id] ?? [];
        return (
          <div
            key={id}
            className={`rounded-[8px] border transition-all duration-200 ${
              isSelected ? 'border-clay bg-clay/10' : 'border-ink/15 bg-transparent'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(id)}
              data-selected={isSelected}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
            >
              <span className="flex flex-col">
                <span className="text-[14px] font-medium text-ink">{tag.label}</span>
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
            {isSelected && subItems.length > 0 && (
              <div className="border-t border-clay/20 px-4 py-3">
                <p className="mb-2 font-mono text-[9.5px] uppercase tracking-wider text-ink-soft">
                  细化 · 选中子项将强化该兴趣权重
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {subItems.map((sub) => {
                    const subSelected = chosenSubs.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onToggleSub(id, sub.id)}
                        data-selected={subSelected}
                        className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                          subSelected
                            ? 'border-clay bg-clay text-paper'
                            : 'border-ink/20 text-ink-soft hover:border-ink/50 hover:text-ink'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
