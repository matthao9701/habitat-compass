import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import Landing from './components/Landing';
import TabBar, { type TabId } from './components/TabBar';
import Footer from './components/Footer';
import PwaInstallCard from './components/PwaInstallCard';
import KofiWidget from './components/KofiWidget';

// 首页（Landing）同步加载，保证首屏最快；其余页面按需懒加载，拆出独立 chunk。
//
// 发版韧性：懒加载 chunk 文件名带内容哈希，每次部署旧文件即被删除。若用户停在
// 旧页面（或 Service Worker 缓存了旧 HTML），部署后再点击 Tab 触发按需加载，会请求
// 已不存在的旧 chunk → 404 → 页面卡死（表现为「白屏 / 一直 Loading」），同时向边缘
// 产生 4xx。这里包装 import()：失败时自动整页刷新一次拉取新版本；用 sessionStorage
// 标记防止在真正故障（如离线）时陷入刷新死循环。
const RELOAD_FLAG = 'hc:chunk-reload';
function lazyWithReload<P>(factory: () => Promise<{ default: React.ComponentType<P> }>) {
  return lazy(() =>
    factory()
      .then((mod) => {
        // 加载成功：清除标记，使后续（新的）发版仍能触发一次自动恢复
        try {
          sessionStorage.removeItem(RELOAD_FLAG);
        } catch {
          /* 忽略 */
        }
        return mod;
      })
      .catch((err: unknown) => {
        try {
          if (!sessionStorage.getItem(RELOAD_FLAG)) {
            sessionStorage.setItem(RELOAD_FLAG, '1');
            window.location.reload();
          }
        } catch {
          // 隐私模式等禁用 sessionStorage 时忽略，直接抛出交由错误边界/上层处理
        }
        throw err;
      }),
  );
}

const Quiz = lazyWithReload(() => import('./components/Quiz'));
const Report = lazyWithReload(() => import('./components/Report'));
const CompareScreen = lazyWithReload(() => import('./components/compare/CompareScreen'));
const ProfileScreen = lazyWithReload(() => import('./components/ProfileScreen'));
const TaxPlanner = lazyWithReload(() => import('./components/TaxPlanner'));
const CityBrowser = lazyWithReload(() => import('./components/CityBrowser'));
import { assess, type UserAnswers, type AssessmentResult, type QuizVersion, isDeep } from './lib/engine';
import { DEMO_PROFILES, buildDemoAnswers } from './data/demoProfiles';
import * as storage from './lib/storage';
import { applyHardConstraints, applyOverBudgetPenalty, hasAnyConstraint, type HardConstraints } from './lib/constraints';
import { registerServiceWorker } from './lib/pwa';
import { track, trackStage } from './lib/telemetry';
import { cities as CITIES } from './data';
import { I18nProvider } from './i18n';

type Screen = 'landing' | 'cities' | 'quiz' | 'report' | 'compare' | 'profile' | 'tax';

/** 懒加载页面的占位：保持版式稳定，避免布局跳动 */
function ScreenFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="font-data text-[11px] uppercase tracking-[0.22em] text-ink-soft">Loading…</span>
    </div>
  );
}

/** Tab 栏仅在常驻页面显示（quiz / report 为专注模式） */
const TAB_SCREENS: Screen[] = ['landing', 'cities', 'tax', 'compare', 'profile'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<UserAnswers | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [quizVersion, setQuizVersion] = useState<QuizVersion>('lite');
  const [compareSeed, setCompareSeed] = useState<string[]>([]);
  /** 税负测算页预置城市（来自报告卡片 CTA 或 URL ?city=） */
  const [taxCityId, setTaxCityId] = useState<string | null>(null);

  // PWA：注册 Service Worker（仅支持原生安装事件的浏览器；见 lib/pwa.ts 说明）
  useEffect(() => {
    registerServiceWorker();
  }, []);

  /** 读取 URL 查询参数（静态子页面 /tax-calculator/ 直达时携带 ?city=<id> 预置城市） */
  useEffect(() => {
    try {
      const c = new URLSearchParams(window.location.search).get('city');
      if (c) {
        setTaxCityId(c);
        setScreen('tax');
      }
    } catch {
      // 非浏览器/异常环境忽略
    }
  }, []);

  function go(next: Screen): void {
    window.scrollTo(0, 0);
    setScreen(next);
  }

  function openTab(tab: TabId): void {
    if (tab === 'tax') {
      openTax(null);
      return;
    }
    go(tab);
  }

  /**
   * 打开税负测算子页面：可在 URL 上同步 ?city=<id>（便于分享/刷新还原）。
   * 应用内为状态切换（不整页跳转），静态 SEO 页 /tax-calculator/ 则回链到 /?city=<id>。
   */
  function openTax(cityId: string | null): void {
    setTaxCityId(cityId);
    try {
      const url = new URL(window.location.href);
      if (cityId) url.searchParams.set('city', cityId);
      else url.searchParams.delete('city');
      window.history.replaceState(null, '', url);
    } catch {
      // 非浏览器环境忽略
    }
    go('tax');
  }

  /** 进入测评：startDeep=true 时直接进入深化段（如从「我的」页发起标准版）；默认走完整流程 */
  function startQuiz(startDeep = false): void {
    track(startDeep ? 'quiz_version_pro' : 'quiz_version_lite');
    setQuizVersion(startDeep ? 'pro' : 'lite');
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
    // 融合题库统一使用同一草稿 key；旧 proDraft 一并清理，避免续答残留
    storage.clearDraft();
    storage.clearProDraft();
    if (isDeep(done)) {
      storage.saveProHistory(done, assessment);
    } else {
      storage.saveHistory(done, assessment);
    }
    setAnswers(done);
    setResult(assessment);
    setIsDemo(false);
    go('report');
  }

  function restart(): void {
    const deep = result?.version === 'pro';
    setResult(null);
    setAnswers(null);
    setIsDemo(false);
    setQuizVersion(deep ? 'pro' : 'lite');
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
      {/* reducedMotion="user"：系统开启「减少动态效果」时，framer-motion 自动跳过位移/缩放/淡入，
          与 index.css 的 @media (prefers-reduced-motion) 规则协同（DESIGN.md 动效规范要求）。 */}
      <MotionConfig reducedMotion="user">
        {/* 移动端底部导航为固定层，故在常驻页面为内容预留等高防遮挡间距（含安全区） */}
        <div
          className={`min-h-screen bg-paper ${
            TAB_SCREENS.includes(screen) ? 'pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0' : ''
          }`}
        >
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
                  <Landing onStart={startQuiz} onDemo={openDemo} onBrowse={() => go('cities')} />
                )}
                {screen === 'cities' && <CityBrowser />}
                {screen === 'quiz' && (
                  <Quiz onComplete={completeQuiz} onExit={exitQuiz} startDeep={quizVersion === 'pro'} />
                )}
                {screen === 'report' && result && (
                  <Report
                    result={result}
                    onRestart={restart}
                    isDemo={isDemo}
                    onStartQuiz={startQuiz}
                    onOpenTax={(cityId) => openTax(cityId)}
                  />
                )}
                {screen === 'compare' && (
                  <CompareScreen
                    result={result}
                    answers={answers}
                    seedCities={compareSeed}
                    onOpenQuiz={startQuiz}
                  />
                )}
                {screen === 'tax' && (
                  <TaxPlanner initialCityId={taxCityId} onOpenQuiz={startQuiz} />
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
          {/* Ko-fi 打赏悬浮胶囊：仅 SPA 侧注入（静态落地页保持自包含）；单例守卫防重复 */}
          <KofiWidget />
        </div>
      </MotionConfig>
    </I18nProvider>
  );
}
