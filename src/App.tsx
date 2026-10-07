import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './components/Landing';
import TabBar, { type TabId } from './components/TabBar';
import Footer from './components/Footer';
import PwaInstallCard from './components/PwaInstallCard';

// 首页（Landing）同步加载，保证首屏最快；其余页面按需懒加载，拆出独立 chunk。
const Quiz = lazy(() => import('./components/Quiz'));
const Report = lazy(() => import('./components/Report'));
const CompareScreen = lazy(() => import('./components/compare/CompareScreen'));
const ProfileScreen = lazy(() => import('./components/ProfileScreen'));
import { assess, type UserAnswers, type AssessmentResult, type QuizVersion } from './lib/engine';
import { DEMO_PROFILES, buildDemoAnswers } from './data/demoProfiles';
import * as storage from './lib/storage';
import { applyHardConstraints, applyOverBudgetPenalty, hasAnyConstraint, type HardConstraints } from './lib/constraints';
import { registerServiceWorker } from './lib/pwa';
import { track, trackStage } from './lib/telemetry';
import { cities as CITIES } from './data';
import { I18nProvider } from './i18n';

type Screen = 'landing' | 'quiz' | 'report' | 'compare' | 'profile';

/** 懒加载页面的占位：保持版式稳定，避免布局跳动 */
function ScreenFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="font-data text-[11px] uppercase tracking-[0.22em] text-ink-soft">Loading…</span>
    </div>
  );
}

/** Tab 栏仅在三个常驻页面显示（quiz / report 为专注模式） */
const TAB_SCREENS: Screen[] = ['landing', 'compare', 'profile'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<UserAnswers | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [quizVersion, setQuizVersion] = useState<QuizVersion>('lite');
  const [compareSeed, setCompareSeed] = useState<string[]>([]);

  // PWA：注册 Service Worker（仅支持原生安装事件的浏览器；见 lib/pwa.ts 说明）
  useEffect(() => {
    registerServiceWorker();
  }, []);

  function go(next: Screen): void {
    window.scrollTo(0, 0);
    setScreen(next);
  }

  function openTab(tab: TabId): void {
    go(tab);
  }

  /** 进入测评：两版全量免费开放 */
  function startQuiz(version: QuizVersion = 'lite'): void {
    track(version === 'pro' ? 'quiz_version_pro' : 'quiz_version_lite');
    setQuizVersion(version);
    go('quiz');
  }

  function exitQuiz(): void {
    go('landing');
  }

  /** 硬约束过滤 + 引擎打分（硬约束在打分前一票否决，不影响 30/48/22 权重） */
  function runAssessment(done: UserAnswers, hc: HardConstraints | null): AssessmentResult {
    const cRes = applyHardConstraints(CITIES, hc);
    const assessment = assess(done, cRes.kept);
    const matches = applyOverBudgetPenalty(assessment.matches, cRes.overBudgetIds);
    return {
      ...assessment,
      matches,
      constraints: cRes.applied
        ? {
            applied: true,
            relaxed: cRes.relaxed,
            excludedCount: cRes.excluded.length,
            excluded: cRes.excluded,
            overBudgetIds: cRes.overBudgetIds,
            passportSkipped: cRes.passportSkipped,
          }
        : undefined,
    };
  }

  function completeQuiz(done: UserAnswers): void {
    const hc = storage.loadHardConstraints();
    if (hasAnyConstraint(hc)) track('hard_constraints_used');
    trackStage('complete', 4, 'quiz');
    const assessment = runAssessment(done, hc);
    track('report_generated');
    if (done.version === 'pro') {
      storage.clearProDraft(); // 完成后清除标准版草稿
      storage.saveProHistory(done, assessment);
    } else {
      storage.clearDraft(); // 完成后清除简易版草稿
      storage.saveHistory(done, assessment);
    }
    setAnswers(done);
    setResult(assessment);
    setIsDemo(false);
    go('report');
  }

  function restart(): void {
    const version = result?.version === 'pro' ? 'pro' : 'lite';
    setResult(null);
    setAnswers(null);
    setIsDemo(false);
    setQuizVersion(version);
    go('quiz');
  }

  function openDemo(profileId: string): void {
    const profile = DEMO_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;
    const demoAnswers = buildDemoAnswers(profile);
    setAnswers(demoAnswers);
    setResult(assess(demoAnswers));
    setIsDemo(true);
    go('report');
  }

  /** 我的 Tab：恢复最近一次测评报告（简易版 / 标准版各一条） */
  function openHistory(version: QuizVersion = 'lite'): void {
    const entry = version === 'pro' ? storage.loadProHistory() : storage.loadHistory();
    if (!entry) return;
    setAnswers(entry.answers);
    setResult(entry.result);
    setIsDemo(false);
    go('report');
  }

  /** 进入对比页，可携带预选城市（如从收藏加入对比） */
  function openCompare(seed?: string[]): void {
    setCompareSeed(seed ?? []);
    go('compare');
  }

  return (
    <I18nProvider>
      <div className="min-h-screen bg-paper">
        {TAB_SCREENS.includes(screen) && (
          <TabBar active={screen as TabId} onChange={openTab} />
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<ScreenFallback />}>
              {screen === 'landing' && (
                <Landing onStart={startQuiz} onDemo={openDemo} />
              )}
              {screen === 'quiz' && (
                <Quiz onComplete={completeQuiz} onExit={exitQuiz} version={quizVersion} />
              )}
              {screen === 'report' && result && (
                <Report result={result} onRestart={restart} isDemo={isDemo} onStartQuiz={startQuiz} />
              )}
              {screen === 'compare' && (
                <CompareScreen
                  result={result}
                  answers={answers}
                  seedCities={compareSeed}
                  onOpenQuiz={startQuiz}
                />
              )}
              {screen === 'profile' && (
                <ProfileScreen
                  onOpenQuiz={startQuiz}
                  onOpenHistory={openHistory}
                  onOpenCompare={openCompare}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
        {TAB_SCREENS.includes(screen) && <Footer />}
        {/* 常驻挂载以捕获 beforeinstallprompt（该事件每页只触发一次）；
            仅在常驻页面展示：测评/报告是专注模式，底部固定操作栏会被浮层遮挡 */}
        <PwaInstallCard enabled={TAB_SCREENS.includes(screen)} />
      </div>
    </I18nProvider>
  );
}
