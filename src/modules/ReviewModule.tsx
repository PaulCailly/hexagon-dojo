import { useState } from "react";
import { REVIEWS } from "../content/reviews";
import { Code } from "../components/Code";
import { Tag } from "../components/Tag";
import { focusRing } from "../components/focus";
import { judgmentScore } from "../lib/scoring";

export default function ReviewModule() {
  const [m, setM] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const mission = REVIEWS[m];

  const toggle = (idx: number) => {
    if (revealed) return;
    const next = new Set(checked);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setChecked(next);
  };

  const correctCount = judgmentScore(mission.issues, checked);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {REVIEWS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setM(idx);
              setChecked(new Set());
              setRevealed(false);
            }}
            aria-pressed={idx === m}
            className={`px-3 py-1 rounded-full text-xs font-mono border ${focusRing} ${
              idx === m
                ? "bg-amber-900 border-amber-600 text-amber-200"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-700"
            }`}
          >
            Mission {idx + 1}
          </button>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">
        {mission.title}
      </h3>
      <p className="text-sm text-slate-400 mb-3">{mission.intro}</p>
      <Code>{mission.code}</Code>
      <div className="mt-4 space-y-2">
        {mission.issues.map((it, idx) => {
          let cls = checked.has(idx)
            ? "border-amber-500 bg-amber-950 text-amber-100"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-700";
          if (revealed) {
            if (it.correct)
              cls = "border-emerald-500 bg-emerald-950 text-emerald-100";
            else if (checked.has(idx))
              cls = "border-rose-500 bg-rose-950 text-rose-100";
            else cls = "border-slate-800 bg-slate-900 text-slate-500";
          }
          return (
            <div key={idx}>
              <button
                onClick={() => toggle(idx)}
                aria-pressed={checked.has(idx)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${focusRing} ${cls}`}
              >
                <span className="font-mono mr-2">
                  {revealed
                    ? it.correct
                      ? "✔"
                      : checked.has(idx)
                        ? "✘"
                        : "·"
                    : checked.has(idx)
                      ? "◼"
                      : "◻"}
                </span>
                {it.text}
              </button>
              {revealed && (
                <p className="text-xs text-slate-400 mt-1 ml-4">{it.why}</p>
              )}
            </div>
          );
        })}
      </div>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className={`mt-4 px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-medium ${focusRing}`}
        >
          Reveal answers
        </button>
      ) : (
        <div className="mt-4">
          <Tag
            color={correctCount === mission.issues.length ? "emerald" : "amber"}
          >
            {correctCount} / {mission.issues.length} judgments correct
          </Tag>
          <h4 className="text-sm font-semibold text-slate-200 mt-4 mb-2">
            How the fix looks
          </h4>
          <Code>{mission.fix}</Code>
        </div>
      )}
    </div>
  );
}
