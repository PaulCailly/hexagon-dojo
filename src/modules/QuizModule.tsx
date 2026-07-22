import { useState } from "react";
import { QUIZ } from "../content/quiz";
import { Hex } from "../components/Hex";
import { Tag } from "../components/Tag";
import { focusRing } from "../components/focus";
import { quizVerdict } from "../lib/scoring";

export default function QuizModule({
  onBest,
}: {
  onBest: (score: number) => void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ[i];

  const pick = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 >= QUIZ.length) {
      setDone(true);
      onBest(score);
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
            {score}/{QUIZ.length}
          </span>
        </Hex>
        <p className="text-slate-300 mb-2">{quizVerdict(score)}</p>
        <button
          onClick={() => {
            setI(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
          className={`mt-4 px-5 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium ${focusRing}`}
        >
          Run it again
        </button>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Tag color="cyan">
          Question {i + 1} / {QUIZ.length}
        </Tag>
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
            {i + 1 >= QUIZ.length ? "See result" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
