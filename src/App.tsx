import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './components/Landing';
import Quiz from './components/Quiz';
import Report from './components/Report';
import TabBar, { type TabId } from './components/TabBar';
import CompareScreen from './components/compare/CompareScreen';
import ProfileScreen from './components/ProfileScreen';
import { assess, type UserAnswers, type AssessmentResult } from './lib/engine';
import { DEMO_PROFILES, buildDemoAnswers } from './data/demoProfiles';
import * as storage from './lib/storage';

type Screen = 'landing' | 'quiz' | 'report' | 'compare' | 'profile';

/** Tab 栏仅在三个常驻页面显示（quiz / report 为专注模式） */
const TAB_SCREENS: Screen[] = ['landing', 'compare', 'profile'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<UserAnswers | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [compareSeed, setCompareSeed] = useState<string[]>([]);

  function go(next: Screen): void {
    window.scrollTo(0, 0);
    setScreen(next);
  }

  function openTab(tab: TabId): void {
    go(tab);
  }

  function startQuiz(): void {
    go('quiz');
  }

  function exitQuiz(): void {
    go('landing');
  }

  function completeQuiz(answers: UserAnswers): void {
    const assessment = assess(answers);
    storage.clearDraft(); // 完成后清除草稿
    storage.saveHistory(answers, assessment);
    setAnswers(answers);
    setResult(assessment);
    setIsDemo(false);
    go('report');
  }

  function restart(): void {
    setResult(null);
    setAnswers(null);
    setIsDemo(false);
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

  /** 我的 Tab：恢复最近一次测评报告 */
  function openHistory(): void {
    const entry = storage.loadHistory();
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
          {screen === 'landing' && <Landing onStart={startQuiz} onDemo={openDemo} />}
          {screen === 'quiz' && <Quiz onComplete={completeQuiz} onExit={exitQuiz} />}
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
