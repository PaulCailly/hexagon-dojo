import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { QUIZ_SETS } from "../content/quiz";
import type { QuizSet } from "../content/types";
import { Hex } from "../components/Hex";
import { Tag } from "../components/Tag";
import { focusRing } from "../components/focus";
import { quizVerdict } from "../lib/scoring";
import { loadProgress } from "../lib/storage";

function SetPicker() {
  const best = loadProgress().quizBest;
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">
        Pick a question set
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        {QUIZ_SETS.length} sets ·{" "}
        {QUIZ_SETS.reduce((n, s) => n + s.questions.length, 0)} questions. Aim
        for 10+ on each before the interview.
      </p>
      <div className="space-y-2">
        {QUIZ_SETS.map((set, i) => (
          <Link
            key={set.id}
            to={`/quiz/${set.id}`}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 hover:border-cyan-600 transition-colors ${focusRing}`}
          >
            <Hex className="w-9 h-9 flex-shrink-0 bg-cyan-900 text-cyan-200 text-xs font-bold">
              {i + 1}
            </Hex>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-100">{set.title}</p>
              <p className="text-xs text-slate-400 font-mono">
                {set.questions.length} questions
              </p>
            </div>
            <Tag color={best[set.id] !== undefined ? "cyan" : "slate"}>
              {best[set.id] !== undefined
                ? `best ${best[set.id]}/${set.questions.length}`
                : "not run"}
            </Tag>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SetRunner({
  set,
  onBest,
}: {
  set: QuizSet;
  onBest: (setId: string, score: number) => void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  // restart cleanly when switching sets
  useEffect(() => {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }, [set.id]);

  const q = set.questions[i];

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 >= set.questions.length) {
      setDone(true);
      onBest(set.id, score);
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };

  if (done)
    return (
      <div className="text-center py-12">
        <Hex className="w-24 h-24 mx-auto bg-cyan-900 mb-4">
          <span className="text-2xl font-bold text-cyan-200">
            {score}/{set.questions.length}
          </span>
        </Hex>
        <p className="text-slate-300 mb-2">{quizVerdict(score)}</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => {
              setI(0);
              setPicked(null);
              setScore(0);
              setDone(false);
            }}
            className={`px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium ${focusRing}`}
          >
            Run it again
          </button>
          <button
            onClick={() => navigate("/quiz")}
            className={`px-5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 ${focusRing}`}
          >
            All sets
          </button>
        </div>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/quiz"
            className={`text-xs font-mono text-slate-400 hover:text-slate-200 whitespace-nowrap ${focusRing}`}
          >
            ← sets
          </Link>
          <Tag color="cyan">
            {set.title} · {i + 1} / {set.questions.length}
          </Tag>
        </div>
        <Tag color="slate">Score {score}</Tag>
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{q.q}</h3>
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let cls =
            "border-slate-700 bg-slate-900 hover:border-cyan-600 text-slate-200";
          if (picked !== null) {
            if (idx === q.answer)
              cls = "border-emerald-500 bg-emerald-950 text-emerald-200";
            else if (idx === picked)
              cls = "border-rose-500 bg-rose-950 text-rose-200";
            else cls = "border-slate-800 bg-slate-900 text-slate-500";
          }
          return (
            <button
              key={idx}
              onClick={() => pick(idx)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${focusRing} ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 p-4 rounded-lg bg-slate-900 border border-slate-700">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-cyan-300">Why: </span>
            {q.why}
          </p>
          <button
            onClick={next}
            className={`mt-3 px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium ${focusRing}`}
          >
            {i + 1 >= set.questions.length ? "See result" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuizModule({
  onBest,
}: {
  onBest: (setId: string, score: number) => void;
}) {
  const { set: setId } = useParams();
  const set = QUIZ_SETS.find((s) => s.id === setId);
  if (!set) return <SetPicker />;
  return <SetRunner set={set} onBest={onBest} />;
}
