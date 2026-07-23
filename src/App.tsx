import { useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router";
import { QUIZ_SETS } from "./content/quiz";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Hex } from "./components/Hex";
import { Tag } from "./components/Tag";
import { focusRing } from "./components/focus";
import { bestScore } from "./lib/scoring";
import { loadProgress, resetProgress, saveProgress } from "./lib/storage";
import BookModule from "./modules/BookModule";
import QuizModule from "./modules/QuizModule";
import ReviewModule from "./modules/ReviewModule";
import DrillModule from "./modules/DrillModule";
import TestModule from "./modules/TestModule";
import CardsModule from "./modules/CardsModule";

const MODULES = [
  { path: "/book", label: "The Book", sub: "chapters" },
  { path: "/quiz", label: "Concepts", sub: "QCM" },
  { path: "/review", label: "Code review", sub: "Missions" },
  { path: "/drill", label: "Classify", sub: "Drills" },
  { path: "/testing", label: "Testing", sub: "Missions" },
  { path: "/cards", label: "Talk tracks", sub: "Flashcards" },
];

const QUIZ_TOTAL = QUIZ_SETS.reduce((n, s) => n + s.questions.length, 0);
const sumBest = (best: Record<string, number>) =>
  Object.values(best).reduce((a, b) => a + b, 0);

export default function App() {
  const navigate = useNavigate();
  const [quizBest, setQuizBest] = useState<Record<string, number>>(
    () => loadProgress().quizBest,
  );

  const handleQuizBest = (setId: string, score: number) => {
    const next = {
      ...loadProgress().quizBest,
      [setId]: bestScore(loadProgress().quizBest[setId] ?? null, score),
    };
    setQuizBest(next);
    saveProgress({ quizBest: next });
  };

  const handleReset = () => {
    resetProgress();
    setQuizBest({});
    navigate("/book/1");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Hex className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-violet-600 flex-shrink-0">
            <span className="text-white font-bold text-lg">H</span>
          </Hex>
          <div>
            <h1 className="text-xl font-bold text-slate-50 leading-tight">
              Hexagon Dojo
            </h1>
            <p className="text-xs text-slate-400">
              ports, adapters, dependency injection
            </p>
          </div>
          {Object.keys(quizBest).length > 0 && (
            <div className="ml-auto">
              <Tag color="cyan">
                Quiz best: {sumBest(quizBest)}/{QUIZ_TOTAL}
              </Tag>
            </div>
          )}
        </div>
        <nav className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {MODULES.map((mod) => (
            <NavLink
              key={mod.path}
              to={mod.path}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${focusRing} ${
                  isActive
                    ? "border-cyan-400 text-slate-50"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`
              }
            >
              {mod.label}
              <span className="ml-1.5 text-xs text-slate-400 font-mono">
                {mod.sub}
              </span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/book" replace />} />
            <Route path="/book/:chapter?" element={<BookModule />} />
            <Route
              path="/quiz/:set?"
              element={<QuizModule onBest={handleQuizBest} />}
            />
            <Route path="/review" element={<ReviewModule />} />
            <Route path="/drill/:set?" element={<DrillModule />} />
            <Route path="/testing/:mission?" element={<TestModule />} />
            <Route path="/cards" element={<CardsModule />} />
            <Route path="*" element={<Navigate to="/book" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <footer className="max-w-3xl mx-auto px-4 pb-8">
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">
            The 5 interview phases mapped to this dojo:
          </span>{" "}
          codebase reasoning → Classify drill and reading routine cards · code
          review → Missions · testing → Testing mission · AI collaboration → AI
          cards (narrate, delegate boilerplate, verify out loud) · system design
          and product mindset → Talk tracks.
        </div>
        <div className="mt-3 text-center">
          <button
            onClick={handleReset}
            className={`text-xs text-slate-400 underline hover:text-slate-200 ${focusRing}`}
          >
            Reset progress
          </button>
        </div>
      </footer>
    </div>
  );
}
