import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './components/Landing';
import Quiz from './components/Quiz';
import Report from './components/Report';
import ProIntro from './components/billing/ProIntro';
import TabBar, { type TabId } from './components/TabBar';
import CompareScreen from './components/compare/CompareScreen';
import ProfileScreen from './components/ProfileScreen';
import { assess, type UserAnswers, type AssessmentResult, type QuizVersion } from './lib/engine';
import { DEMO_PROFILES, buildDemoAnswers } from './data/demoProfiles';
import * as storage from './lib/storage';
import { applyHardConstraints, applyOverBudgetPenalty, hasAnyConstraint, type HardConstraints } from './lib/constraints';
import { track, trackStage } from './lib/telemetry';
import { cities as CITIES } from './data';
import { I18nProvider } from './i18n';

type Screen = 'landing' | 'quiz' | 'report' | 'compare' | 'profile' | 'pro-intro';

/** Tab 栏仅在三个常驻页面显示（quiz / report / pro-intro 为专注模式） */
const TAB_SCREENS: Screen[] = ['landing', 'compare', 'profile'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<UserAnswers | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [quizVersion, setQuizVersion] = useState<QuizVersion>('lite');
  const [compareSeed, setCompareSeed] = useState<string[]>([]);

  function go(next: Screen): void {
    window.scrollTo(0, 0);
    setScreen(next);
  }

  function openTab(tab: TabId): void {
    go(tab);
  }

  /** 进入测评：标准版未解锁时跳商品介绍页（可预览，不可答题） */
  function startQuiz(version: QuizVersion = 'lite'): void {
    track(version === 'pro' ? 'quiz_version_pro' : 'quiz_version_lite');
    if (version === 'pro' && !storage.isProUnlocked()) {
      go('pro-intro');
      return;
    }
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

  /** 标准版商品介绍页（未购买可预览） */
  function openProIntro(): void {
    go('pro-intro');
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
            {screen === 'landing' && (
              <Landing onStart={startQuiz} onDemo={openDemo} onProIntro={openProIntro} />
            )}
            {screen === 'pro-intro' && (
              <ProIntro
                onStartPro={() => startQuiz('pro')}
                onExit={exitQuiz}
              />
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
                onProIntro={openProIntro}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </I18nProvider>
  );
}
