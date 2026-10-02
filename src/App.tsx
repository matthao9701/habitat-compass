import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './components/Landing';
import Quiz from './components/Quiz';
import Report from './components/Report';
import { assess, type UserAnswers, type AssessmentResult } from './lib/engine';

type Screen = 'landing' | 'quiz' | 'report';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [result, setResult] = useState<AssessmentResult | null>(null);

  function startQuiz(): void {
    window.scrollTo(0, 0);
    setScreen('quiz');
  }

  function exitQuiz(): void {
    window.scrollTo(0, 0);
    setScreen('landing');
  }

  function completeQuiz(answers: UserAnswers): void {
    const assessment = assess(answers);
    setResult(assessment);
    window.scrollTo(0, 0);
    setScreen('report');
  }

  function restart(): void {
    setResult(null);
    window.scrollTo(0, 0);
    setScreen('quiz');
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {screen === 'landing' && <Landing onStart={startQuiz} />}
        {screen === 'quiz' && <Quiz onComplete={completeQuiz} onExit={exitQuiz} />}
        {screen === 'report' && result && <Report result={result} onRestart={restart} />}
      </motion.div>
    </AnimatePresence>
  );
}
