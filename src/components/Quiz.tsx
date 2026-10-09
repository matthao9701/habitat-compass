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
import {
  riasecQuestions,
  RIASEC_SCALE,
  type RiasecQuestion,
} from '../data/riasec';
import { riskQuestions, type RiskQuestion } from '../data/riskTaking';
import type { InterestTag } from '../data/interests';
import type { UserAnswers } from '../lib/engine';
import * as storage from '../lib/storage';
import { useI18n, translate, getCurrentLang } from '../i18n';

/** 草稿是否已进入深化段（含 IPIP 作答）：用于续答时判定是否展开深化段页面 */
function isDraftDeep(draft: UserAnswers | null): boolean {
  return !!draft?.ipip && Object.keys(draft.ipip).length > 0;
}

/** 草稿恢复：跳到第一个含未答题的数据页 */
function firstIncompletePage(pages: Page[], draft: UserAnswers | null, deep: boolean): number {
  if (!draft) return 0;
  const idx = pages.findIndex((p) => {
    if (p.kind === 'transition' || p.kind === 'deepen') return false;
    return p.items.some((item) => {
      if (item.kind === 'mbti')
        return typeof draft.mbti[item.question.id] !== 'number';
      if (item.kind === 'ipip')
        return typeof (draft.ipip ?? {})[item.question.id] !== 'number';
      if (item.kind === 'lifestyle' || item.kind === 'proLifestyle')
        return !draft.lifestyle[item.question.id];
      if (item.kind === 'riasec')
        return typeof (draft.riasec ?? {})[item.question.id] !== 'number';
      if (item.kind === 'risk')
        return typeof (draft.risk ?? {})[item.question.id] !== 'number';
      return false;
    });
  });
  if (idx !== -1) return idx;
  // 全部数据页已答完：深化序列 → 落在最后一页（可点「完成」）；核心序列 → 落在岔口页
  return deep ? pages.length - 1 : pages.findIndex((p) => p.kind === 'deepen');
}

// ---------------------------------------------------------------------------
// 页面模型：核心段数据页 + 深化选择页 + 阶段过渡引导页
//
// 融合题库（统一入口）：所有用户都先完成「核心段」（OEJTS 人格 + 8 情景偏好 +
// 16 兴趣标签，即原简易版）；核心段结束后出现一个「是否继续深化」选择页：
//   - 继续深化 → 追加 IPIP 人格 + 进阶偏好 + 风险自陈 + 28 标签细化 + RIASEC
//   - 直接看报告 → 立即以核心段作答出报告
// 两条路径产出同一份全城库匹配报告，仅深度不同。
// ---------------------------------------------------------------------------

type ModuleId = 'mbti' | 'lifestyle' | 'interests';

type PageItem =
  | { kind: 'mbti'; question: MBTIQuestion }
  | { kind: 'ipip'; question: IpipQuestion }
  | { kind: 'lifestyle'; question: LifestyleQuestion }
  | { kind: 'proLifestyle'; question: ProLifestyleQuestion }
  | { kind: 'interests'; ids: string[] }
  | { kind: 'proInterests'; ids: string[] }
  | { kind: 'riasec'; question: RiasecQuestion }
  | { kind: 'risk'; question: RiskQuestion };

type DataPage = {
  kind: 'data';
  module: ModuleId;
  eyebrow: string;
  items: PageItem[];
  /** 数据页序号，用于分段进度计算 */
  dataPageNo: number;
};

type TransitionPage = { kind: 'transition'; to: 'lifestyle' | 'interests'; variant: 'core' | 'deep' };

/** 深化选择页：核心段与深化段之间的岔口 */
type DeepenPage = { kind: 'deepen' };

type Page = DataPage | TransitionPage | DeepenPage;

const MBTI_CHUNK = 4;
const LIFESTYLE_CHUNK = 4;
const INTEREST_CHUNK = 8;
const IPIP_CHUNK = 6;
const PRO_LIFESTYLE_CHUNK = 4;
const PRO_INTEREST_CHUNK = 10;
const RIASEC_CHUNK = 6;
const RISK_CHUNK = 5;

/** 核心段页（所有人必答） */
function buildCorePages(): Page[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  const pages: Page[] = [];
  let dataPageNo = 0;

  for (let i = 0; i < mbtiQuestions.length; i += MBTI_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'mbti',
      eyebrow: L('quiz.stage.mbti.eyebrow'),
      dataPageNo: dataPageNo++,
      items: mbtiQuestions
        .slice(i, i + MBTI_CHUNK)
        .map((question) => ({ kind: 'mbti' as const, question })),
    });
  }

  pages.push({ kind: 'transition', to: 'lifestyle', variant: 'core' });

  for (let i = 0; i < lifestyleQuestions.length; i += LIFESTYLE_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'lifestyle',
      eyebrow: L('quiz.stage.ls.eyebrow'),
      dataPageNo: dataPageNo++,
      items: lifestyleQuestions
        .slice(i, i + LIFESTYLE_CHUNK)
        .map((question) => ({ kind: 'lifestyle' as const, question })),
    });
  }

  pages.push({ kind: 'transition', to: 'interests', variant: 'core' });

  for (let i = 0; i < interestTags.length; i += INTEREST_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'interests',
      eyebrow: L('quiz.stage.interests.eyebrow'),
      dataPageNo: dataPageNo++,
      items: [
        { kind: 'interests', ids: interestTags.slice(i, i + INTEREST_CHUNK).map((t) => t.id) },
      ],
    });
  }

  return pages;
}

/** 深化段页（用户选择继续后追加） */
function buildDeepenPages(): Page[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  const pages: Page[] = [];
  let dataPageNo = 0;

  for (let i = 0; i < ipipQuestions.length; i += IPIP_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'mbti',
      eyebrow: L('quiz.stage.ipip.eyebrow'),
      dataPageNo: dataPageNo++,
      items: ipipQuestions
        .slice(i, i + IPIP_CHUNK)
        .map((question) => ({ kind: 'ipip' as const, question })),
    });
  }

  pages.push({ kind: 'transition', to: 'lifestyle', variant: 'deep' });

  for (let i = 0; i < proLifestyleQuestions.length; i += PRO_LIFESTYLE_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'lifestyle',
      eyebrow: L('quiz.stage.pro.eyebrow'),
      dataPageNo: dataPageNo++,
      items: proLifestyleQuestions
        .slice(i, i + PRO_LIFESTYLE_CHUNK)
        .map((question) => ({ kind: 'proLifestyle' as const, question })),
    });
  }
  for (let i = 0; i < riskQuestions.length; i += RISK_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'lifestyle',
      eyebrow: L('quiz.stage.risk.eyebrow'),
      dataPageNo: dataPageNo++,
      items: riskQuestions
        .slice(i, i + RISK_CHUNK)
        .map((question) => ({ kind: 'risk' as const, question })),
    });
  }

  pages.push({ kind: 'transition', to: 'interests', variant: 'deep' });

  for (let i = 0; i < interestTagsPro.length; i += PRO_INTEREST_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'interests',
      eyebrow: L('quiz.stage.interestsPro.eyebrow'),
      dataPageNo: dataPageNo++,
      items: [
        {
          kind: 'proInterests',
          ids: interestTagsPro.slice(i, i + PRO_INTEREST_CHUNK).map((t) => t.id),
        },
      ],
    });
  }
  for (let i = 0; i < riasecQuestions.length; i += RIASEC_CHUNK) {
    pages.push({
      kind: 'data',
      module: 'interests',
      eyebrow: L('quiz.stage.riasec.eyebrow'),
      dataPageNo: dataPageNo++,
      items: riasecQuestions
        .slice(i, i + RIASEC_CHUNK)
        .map((question) => ({ kind: 'riasec' as const, question })),
    });
  }

  return pages;
}

/** 完整页面序列：核心段 → 深化岔口 → 深化段（数据页序号全局连续，避免分段进度串台） */
function buildPages(deep: boolean): Page[] {
  const pages: Page[] = [...buildCorePages(), { kind: 'deepen' }];
  if (deep) pages.push(...buildDeepenPages());
  let no = 0;
  for (const p of pages) {
    if (p.kind === 'data') p.dataPageNo = no++;
  }
  return pages;
}

/** 阶段过渡页元信息（工厂：渲染期取当前语言；variant 决定核心段 / 深化段文案） */
function getTransitionMeta(variant: 'core' | 'deep'): TransitionMeta {
  const L = (k: string): string => translate(getCurrentLang(), k);
  if (variant === 'deep') {
    return {
      lifestyle: {
        no: '02',
        title: L('quiz.transition.ls'),
        desc: L('quiz.transition.pro.desc'),
        remaining: L('quiz.transition.pro.meta'),
      },
      interests: {
        no: '03',
        title: L('quiz.transition.interests'),
        desc: L('quiz.transition.interestsPro.desc'),
        remaining: L('quiz.transition.interestsPro.meta'),
      },
    };
  }
  return {
    lifestyle: {
      no: '02',
      title: L('quiz.transition.ls'),
      desc: L('quiz.transition.ls.desc'),
      remaining: L('quiz.transition.ls.meta'),
    },
    interests: {
      no: '03',
      title: L('quiz.transition.interests'),
      desc: L('quiz.transition.interests.desc'),
      remaining: L('quiz.transition.interests.meta'),
    },
  };
}

/** 进度条阶段名（工厂：渲染期取当前语言） */
function phaseLabels(): Record<ModuleId, string> {
  const L = (k: string): string => translate(getCurrentLang(), k);
  return {
    mbti: L('quiz.phase.personality'),
    lifestyle: L('quiz.transition.ls'),
    interests: L('quiz.transition.interests'),
  };
}

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
  /** 起始是否直接进入深化段（如从「我的」页发起标准版）；默认从核心段走完整流程 */
  startDeep?: boolean;
}

export default function Quiz({ onComplete, onExit, startDeep = false }: QuizProps) {
  const { t } = useI18n();
  // 草稿：融合题库统一使用同一 key（旧 proDraft 也纳入回退，尽量不丢历史进度）
  const [draft, setDraft] = useState<UserAnswers | null>(() =>
    storage.loadDraft() ?? storage.loadProDraft(),
  );
  // 是否已进入深化段：决定页面序列是否包含深化段数据页。
  // 起始值：显式要求（从「我的」发起标准版）或草稿已含 IPIP 作答（续答深入到一半的会话）。
  const [deep, setDeep] = useState<boolean>(() => startDeep || isDraftDeep(draft));
  const pages = useMemo(() => buildPages(deep), [deep]);
  const [pageIndex, setPageIndex] = useState(() => firstIncompletePage(pages, draft, deep));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<UserAnswers>(
    () =>
      draft
        ? { passport: storage.loadPassport(), ...draft }
        : {
            mbti: {},
            lifestyle: {},
            interests: [],
            passport: storage.loadPassport(),
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
    Object.keys(answers.ipip ?? {}).length +
    Object.keys(answers.lifestyle).length +
    answers.interests.length +
    Object.keys(answers.riasec ?? {}).length +
    Object.keys(answers.risk ?? {}).length;
  // 分母随深化段开启而切换（兴趣标签按并集去重计一次，与 answeredCount 口径一致）：
  // 核心段 = OEJTS + 8 情景 + 16 标签；深化段 = 上述 + IPIP/进阶偏好/风险/RIASEC + 28 标签
  const interestCount = deep ? interestTagsPro.length : interestTags.length;
  const deepAnswerable =
    ipipQuestions.length +
    proLifestyleQuestions.length +
    riskQuestions.length +
    riasecQuestions.length;
  const totalAnswerable =
    mbtiQuestions.length + lifestyleQuestions.length + interestCount + (deep ? deepAnswerable : 0);
  const progress = Math.min(100, Math.round((answeredCount / totalAnswerable) * 100));

  // 当前页是否全部作答（兴趣页允许 0 选择，因此始终可通过；深化岔口页始终可通过）
  const pageReady =
    page.kind === 'transition' ||
    page.kind === 'deepen' ||
    page.items.every((item) => {
      if (item.kind === 'mbti') return typeof answers.mbti[item.question.id] === 'number';
      if (item.kind === 'ipip')
        return typeof (answers.ipip ?? {})[item.question.id] === 'number';
      if (item.kind === 'lifestyle') return Boolean(answers.lifestyle[item.question.id]);
      if (item.kind === 'proLifestyle')
        return proLifestyleAnswered(item.question, answers.lifestyle);
      if (item.kind === 'riasec')
        return typeof (answers.riasec ?? {})[item.question.id] === 'number';
      if (item.kind === 'risk')
        return typeof (answers.risk ?? {})[item.question.id] === 'number';
      return true;
    });

  // ---- 草稿自动保存（中途退出后可恢复；融合题库统一 key） ----
  useEffect(() => {
    const hasAny =
      Object.keys(answers.mbti).length > 0 ||
      Object.keys(answers.lifestyle).length > 0 ||
      answers.interests.length > 0;
    if (!hasAny) return;
    storage.saveDraft(answers);
  }, [answers]);

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
    storage.clearDraft();
    setDraft(null);
    setAnswers({
      mbti: {},
      lifestyle: {},
      interests: [],
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

  function setIPIPAnswer(id: string, value: number): void {
    setAnswers((prev) => ({ ...prev, ipip: { ...(prev.ipip ?? {}), [id]: value } }));
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

  // 第八轮：RIASEC 六维题 / IPIP Risk-Taking 题作答（旧草稿缺字段时惰性初始化）
  function setRiasecAnswer(id: string, value: number): void {
    setAnswers((prev) => ({
      ...prev,
      riasec: { ...(prev.riasec ?? {}), [id]: value },
    }));
  }

  function setRiskAnswer(id: string, value: number): void {
    setAnswers((prev) => ({
      ...prev,
      risk: { ...(prev.risk ?? {}), [id]: value },
    }));
  }

  function goNext(): void {
    if (!pageReady) return;
    // 深化岔口页：点「下一步」即视为跳过深化，直接以核心段作答出报告
    if (page.kind === 'deepen') {
      onComplete(answers);
      return;
    }
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

  /** 深化岔口：选择继续深化 → 展开深化段页面并前进到第一页 */
  function chooseDeep(): void {
    track('quiz_version_pro');
    setDeep(true);
    setDirection(1);
    setPageIndex((i) => i + 1);
  }

  /** 硬性条件：保存 → 记埋点 → 进入答题 */
  function applyConstraints(hc: HardConstraints): void {
    storage.saveHardConstraints(hc);
    setAppliedConstraints(hc);
    // 第九轮：护照选择随硬约束一起进入作答存档（草稿机制自动持久化）
    setAnswers((prev) => ({ ...prev, passport: hc.passport }));
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
  const transitionMeta = page.kind === 'transition' ? getTransitionMeta(page.variant) : null;
  const pageMarker =
    page.kind === 'data' && page.items[0]?.kind === 'ipip' ? 'RATE 1-5' : null;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* 顶部进度 */}
      <header className="border-b hairline bg-paper/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[860px] px-6 pt-4 md:px-8 md:pt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CompassMark size={22} />
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                {deep ? 'STANDARD · PRO' : 'LITE'}
              </span>
            </div>
            {stage === 'constraints' ? (
              <button
                type="button"
                onClick={onExit}
                className="font-mono text-[10px] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {t('quiz.backHome')}
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStage('constraints')}
                  className="font-mono text-[10px] text-ink-soft underline-offset-4 transition-colors hover:text-clay hover:underline"
                >
                  {t('cons.nav.title')}{hasAnyConstraint(appliedConstraints) ? ' ✓' : ''}
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
                  {phaseLabels()[module]}
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
              <TransitionStage to={page.to} meta={transitionMeta!} />
            ) : page.kind === 'deepen' ? (
              <DeepenStage onContinue={chooseDeep} onSkip={() => onComplete(answers)} />
            ) : (
              <>
                <p className="eyebrow mb-2">{page.eyebrow}</p>
                <div className="mb-8 mt-3 flex items-center gap-4">
                  <div className="h-px flex-1 bg-ink/15" />
                  <p className="font-mono text-[10px] text-ink-soft">
                    {page.items[0]?.kind === 'interests' || page.items[0]?.kind === 'proInterests'
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
                          value={(answers.ipip ?? {})[item.question.id]}
                          onSelect={(value) => setIPIPAnswer(item.question.id, value)}
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
                    if (item.kind === 'riasec') {
                      return (
                        <RiasecItem
                          key={item.question.id}
                          question={item.question}
                          value={(answers.riasec ?? {})[item.question.id]}
                          onSelect={(value) => setRiasecAnswer(item.question.id, value)}
                        />
                      );
                    }
                    if (item.kind === 'risk') {
                      return (
                        <RiskItem
                          key={item.question.id}
                          question={item.question}
                          value={(answers.risk ?? {})[item.question.id]}
                          onSelect={(value) => setRiskAnswer(item.question.id, value)}
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

                {/* 量表来源脚注：仅在每种题型的第一页展示 */}
                {page.dataPageNo === dataPages.find((p) => p.items[0]?.kind === page.items[0]?.kind)?.dataPageNo &&
                  (page.items[0]?.kind === 'ipip' ? (
                    <p className="mt-8 font-mono text-[9.5px] leading-relaxed text-ink-soft/80">
                      {t('quiz.ipip.source')}
                    </p>
                  ) : page.items[0]?.kind === 'mbti' ? (
                    <p className="mt-8 font-mono text-[9.5px] leading-relaxed text-ink-soft/80">
                      {t('quiz.foot.source', { base: MBTI_SOURCE.base, publisher: MBTI_SOURCE.publisher, license: MBTI_SOURCE.license })}
                    </p>
                  ) : null)}

                {/* 第八轮：RIASEC / 风险题首页来源脚注 */}
                {page.items[0]?.kind === 'riasec' && page.dataPageNo === dataPages.find((p) => p.items[0]?.kind === 'riasec')?.dataPageNo && (
                  <p className="mt-8 font-mono text-[9.5px] leading-relaxed text-ink-soft/80">
                    {t('quiz.riasec.source')}
                  </p>
                )}
                {page.items[0]?.kind === 'risk' && page.dataPageNo === dataPages.find((p) => p.items[0]?.kind === 'risk')?.dataPageNo && (
                  <p className="mt-8 font-mono text-[9.5px] leading-relaxed text-ink-soft/80">
                    {t('quiz.risk.source')}
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
            {pageIndex === 0 ? t('common.backHome') : t('common.prev')}
          </button>
          <div className="hidden items-center gap-3 sm:flex">
            {deep && (
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
            {page.kind === 'deepen' ? t('common.finish') : isLast ? t('common.finish') : t('common.next')}
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
  const { t } = useI18n();
  const m = meta[to];
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-14 text-center md:py-20">
      <div className="mb-6 flex items-center gap-3 text-ink-soft">
        <span className="h-px w-10 bg-ink/20" />
        <CompassMark size={30} />
        <span className="h-px w-10 bg-ink/20" />
      </div>
      <p className="eyebrow">{t('quiz.transition.eyebrow', { no: m.no })}</p>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
        {m.title}
      </h2>
      <p className="mt-5 max-w-md text-[14px] leading-[1.9] text-ink-soft">{m.desc}</p>
      <p className="mt-6 rounded-full border hairline px-4 py-1.5 font-mono text-[10.5px] text-ink-soft">
        {t('quiz.transition.remaining', { count: m.remaining })}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 深化岔口页：核心段结束后的选择——继续深化 or 直接看报告
// ---------------------------------------------------------------------------

function DeepenStage({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-14 text-center md:py-20">
      <div className="mb-6 flex items-center gap-3 text-ink-soft">
        <span className="h-px w-10 bg-ink/20" />
        <CompassMark size={30} />
        <span className="h-px w-10 bg-ink/20" />
      </div>
      <p className="eyebrow">{t('quiz.deepen.eyebrow')}</p>
      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight md:text-3xl">
        {t('quiz.deepen.title')}
      </h2>
      <p className="mt-5 max-w-md text-[14px] leading-[1.9] text-ink-soft">{t('quiz.deepen.desc')}</p>

      <div className="mt-9 flex w-full max-w-sm flex-col gap-3">
        <button type="button" onClick={onContinue} className="btn-clay w-full !py-3.5 text-sm">
          {t('quiz.deepen.continue')}
          <span className="font-mono text-xs opacity-80">→</span>
        </button>
        <button type="button" onClick={onSkip} className="btn-ghost w-full !py-3 text-[13px]">
          {t('quiz.deepen.skip')}
        </button>
      </div>
      <p className="mt-6 rounded-full border hairline px-4 py-1.5 font-mono text-[10.5px] text-ink-soft">
        {t('quiz.deepen.meta')}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 人格七级双极量表
// ---------------------------------------------------------------------------

const SCALE = [1, 2, 3, 4, 5, 6, 7] as const;

interface MBTIItemProps {
  question: MBTIQuestion;
  value?: number;
  onSelect: (value: number) => void;
}

function MBTIItem({ question, value, onSelect }: MBTIItemProps) {
  const { t } = useI18n();
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
              aria-label={t('quiz.mbti.aria', { left: question.left.text, right: question.right.text, v })}
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
        <span>{t('quiz.mbti.left')}</span>
        <span>{t('quiz.mbti.mid')}</span>
        <span>{t('quiz.mbti.right')}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 标准版：IPIP-NEO 五点量表
// ---------------------------------------------------------------------------

/** IPIP 五点量表两端提示（工厂：渲染期取当前语言） */
function ipipScaleHint(): Record<number, string> {
  const { t } = useI18n();
  const L = (k: string): string => translate(getCurrentLang(), k);
  return { 1: L('quiz.ipip.1'), 2: L('quiz.ipip.2'), 3: L('quiz.ipip.3'), 4: L('quiz.ipip.4'), 5: L('quiz.ipip.5') };
}

interface IPIPItemProps {
  question: IpipQuestion;
  value?: number;
  onSelect: (value: number) => void;
}

function IPIPItem({ question, value, onSelect }: IPIPItemProps) {
  const { t, lang } = useI18n();
  const stem = lang === 'en' ? question.ref : question.text;
  return (
    <div className="rounded-[8px] border hairline bg-card/70 px-4 py-5 md:px-6">
      <p className="mb-4 flex items-start gap-3 text-[14px] leading-[1.75]">
        <span className="mt-0.5 shrink-0 font-mono text-[10px] text-ochre-deep">
          {question.domain}
        </span>
        <span className="text-ink">{stem}</span>
      </p>
      <div className="flex items-center justify-between gap-1.5 md:gap-2.5">
        {IPIP_SCALE.map((opt) => {
          const selected = value === opt.value;
          const scaleLabel = t(`quiz.ipip.${opt.value}`);
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={t('quiz.ipip.aria', { text: stem, label: scaleLabel })}
              onClick={() => onSelect(opt.value)}
              data-selected={selected}
              title={scaleLabel}
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
        <span>{ipipScaleHint()[1]}</span>
        <span className="font-mono text-[9px]">{value ? ipipScaleHint()[value] : ''}</span>
        <span>{ipipScaleHint()[5]}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 第八轮：O*NET RIASEC 喜好量表 + IPIP Risk-Taking 自陈量表
// ---------------------------------------------------------------------------

interface RiasecItemProps {
  question: RiasecQuestion;
  value?: number;
  onSelect: (value: number) => void;
}

function RiasecItem({ question, value, onSelect }: RiasecItemProps) {
  const { t, lang } = useI18n();
  const stem = lang === 'en' ? question.ref : question.text;
  const hint = (v: number): string => t(`quiz.riasec.${v}`);
  return (
    <div className="rounded-[8px] border hairline bg-card/70 px-4 py-5 md:px-6">
      <p className="mb-4 flex items-start gap-3 text-[14px] leading-[1.75]">
        <span className="mt-0.5 shrink-0 font-mono text-[10px] text-ochre-deep">
          {question.dim}
        </span>
        <span className="text-ink">{stem}</span>
      </p>
      <div className="flex items-center justify-between gap-1.5 md:gap-2.5">
        {RIASEC_SCALE.map((opt) => {
          const selected = value === opt.value;
          const scaleLabel = hint(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={t('quiz.riasec.aria', { text: stem, label: scaleLabel })}
              onClick={() => onSelect(opt.value)}
              data-selected={selected}
              title={scaleLabel}
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
        <span>{hint(1)}</span>
        <span className="font-mono text-[9px]">{value ? hint(value) : ''}</span>
        <span>{hint(5)}</span>
      </div>
    </div>
  );
}

interface RiskItemProps {
  question: RiskQuestion;
  value?: number;
  onSelect: (value: number) => void;
}

function RiskItem({ question, value, onSelect }: RiskItemProps) {
  const { t, lang } = useI18n();
  const stem = lang === 'en' ? question.ref : question.text;
  const hint = (v: number): string => t(`quiz.ipip.${v}`);
  return (
    <div className="rounded-[8px] border hairline bg-card/70 px-4 py-5 md:px-6">
      <p className="mb-4 text-[14px] leading-[1.75]">
        <span className="text-ink">{stem}</span>
      </p>
      <div className="flex items-center justify-between gap-1.5 md:gap-2.5">
        {IPIP_SCALE.map((opt) => {
          const selected = value === opt.value;
          const scaleLabel = hint(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-label={t('quiz.ipip.aria', { text: stem, label: scaleLabel })}
              onClick={() => onSelect(opt.value)}
              data-selected={selected}
              title={scaleLabel}
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
        <span>{hint(1)}</span>
        <span className="font-mono text-[9px]">{value ? hint(value) : ''}</span>
        <span>{hint(5)}</span>
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
  const { t } = useI18n();
  return (
    <div>
      <p className="mb-1 font-heading text-[17px] font-semibold leading-relaxed md:text-lg">
        {t(question.title)}
      </p>
      {question.hint && (
        <p className="mb-4 font-mono text-[10.5px] text-ink-soft">{t(question.hint)}</p>
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
                <span className="text-[14px] font-medium">{t(option.label)}</span>
                {option.desc && (
                  <span className="mt-0.5 text-[12px] text-ink-soft">{t(option.desc)}</span>
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
  const { t } = useI18n();
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

/** 混编题型标签（工厂：渲染期取当前语言） */
function proKindLabel(): Record<ProLifestyleQuestion['kind'], string> {
  const { t } = useI18n();
  const L = (k: string): string => translate(getCurrentLang(), k);
  return { choice: L('quiz.type.choice'), forced: L('quiz.type.forced'), slider: L('quiz.type.slider'), rank: L('quiz.type.rank') };
}

interface ProLifestyleItemProps {
  question: ProLifestyleQuestion;
  value?: string;
  onChange: (value: string) => void;
}

function ProLifestyleItem({ question, value, onChange }: ProLifestyleItemProps) {
  return (
    <div className="rounded-[8px] border hairline bg-card/70 px-4 py-5 md:px-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded border border-ochre-deep/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ochre-deep">
          {proKindLabel()[question.kind]}
        </span>
      </div>
      <p className="mb-1 font-heading text-[16px] font-semibold leading-relaxed md:text-[17px]">
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
  const { t } = useI18n();
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
                  aria-label={t('quiz.interest.dec', { name: d.label })}
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
                  aria-label={t('quiz.interest.inc', { name: d.label })}
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
          {t('quiz.rank.allocated', { sum, total: q.total })}{full ? t('quiz.rank.full') : t('quiz.rank.left', { n: q.total - sum })}
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
            <span className="font-data text-[12px] tabular-nums text-ochre-deep">
              {idx + 1}
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-medium text-ink">{item.label}</span>
              {item.desc && <span className="block text-[12px] text-ink-soft">{item.desc}</span>}
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                aria-label={t('quiz.rank.up', { name: item.label })}
                disabled={idx === 0}
                onClick={() => move(itemValue, -1)}
                className="h-7 w-7 rounded-md border border-ink/20 font-mono text-[11px] text-ink-soft transition-colors hover:border-ink/50 hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={t('quiz.rank.down', { name: item.label })}
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
      <p className="font-data text-[11px] text-ink-soft">{t('quiz.rank.hint')}</p>
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
  const { t } = useI18n();
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
                  {t('quiz.interest.refine')}
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
