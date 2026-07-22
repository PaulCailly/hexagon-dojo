import { useState } from "react";
import { DRILL, DRILL_OPTIONS, DRILL_COLORS } from "../content/drill";
import type { DrillAnswer, TagColor } from "../content/types";
import { Code } from "../components/Code";
import { Hex } from "../components/Hex";
import { Tag } from "../components/Tag";
import { focusRing } from "../components/focus";
import { bestScore, drillVerdict } from "../lib/scoring";
import { loadProgress, saveProgress } from "../lib/storage";

// Static lookup so the Tailwind compiler sees every hover class (the
// prototype interpolated `hover:border-${c}-600`, which only worked with
// the runtime CDN scanner).
const HOVER_BORDER: Record<TagColor, string> = {
  cyan: "hover:border-cyan-600",
  amber: "hover:border-amber-600",
  violet: "hover:border-violet-600",
  emerald: "hover:border-emerald-600",
  slate: "hover:border-slate-600",
};

export default function DrillModule() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<DrillAnswer | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const item = DRILL[i];

  const pick = (opt: DrillAnswer) => {
    if (picked) return;
    setPicked(opt);
    if (opt === item.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 >= DRILL.length) {
      setDone(true);
      saveProgress({ drillBest: bestScore(loadProgress().drillBest, score) });
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };

  if (done)
    return (
      <div className="text-center py-12">
        <Hex className="w-24 h-24 mx-auto bg-violet-900 mb-4">
          <span className="text-2xl font-bold text-violet-200">
            {score}/{DRILL.length}
          </span>
        </Hex>
        <p className="text-slate-300">{drillVerdict(score, DRILL.length)}</p>
        <button
          onClick={() => {
            setI(0);
            setPicked(null);
            setScore(0);
            setDone(false);
          }}
          className={`mt-4 px-5 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-medium ${focusRing}`}
        >
          Restart drill
        </button>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Tag color="violet">
          {i + 1} / {DRILL.length}
        </Tag>
        <Tag color="slate">Score {score}</Tag>
      </div>
      <p className="text-sm text-slate-400 mb-2">Where does this line belong?</p>
      <Code>{item.code}</Code>
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 mt-4">
        {DRILL_OPTIONS.map((opt) => {
          const c = DRILL_COLORS[opt];
          let cls = `border-slate-700 bg-slate-900 text-slate-200 ${HOVER_BORDER[c]}`;
          if (picked) {
            if (opt === item.answer)
              cls = "border-emerald-500 bg-emerald-950 text-emerald-200";
            else if (opt === picked)
              cls = "border-rose-500 bg-rose-950 text-rose-200";
            else cls = "border-slate-800 bg-slate-900 text-slate-500";
          }
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              className={`px-4 py-3 rounded-lg border font-medium transition-colors ${focusRing} ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="mt-4 p-4 rounded-lg bg-slate-900 border border-slate-700">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-violet-300">
              {item.answer}:{" "}
            </span>
            {item.why}
          </p>
          <button
            onClick={next}
            className={`mt-3 px-5 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-medium ${focusRing}`}
          >
            {i + 1 >= DRILL.length ? "Finish" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
