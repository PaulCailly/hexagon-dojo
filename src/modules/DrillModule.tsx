import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { DRILL_OPTIONS, DRILL_COLORS, DRILL_SETS } from "../content/drill";
import type { DrillAnswer, DrillSet, TagColor } from "../content/types";
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

function SetPicker() {
  const best = loadProgress().drillBest;
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">
        Pick a drill
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        {DRILL_SETS.length} drills ·{" "}
        {DRILL_SETS.reduce((n, s) => n + s.items.length, 0)} lines to classify.
        Perfect runs are the goal: classifying at a glance is the
        codebase-reading superpower.
      </p>
      <div className="space-y-2">
        {DRILL_SETS.map((set, i) => (
          <Link
            key={set.id}
            to={`/drill/${set.id}`}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 hover:border-violet-600 transition-colors ${focusRing}`}
          >
            <Hex className="w-9 h-9 flex-shrink-0 bg-violet-900 text-violet-200 text-xs font-bold">
              {i + 1}
            </Hex>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-100">{set.title}</p>
              <p className="text-xs text-slate-400 font-mono">
                {set.items.length} items
              </p>
            </div>
            <Tag color={best[set.id] !== undefined ? "violet" : "slate"}>
              {best[set.id] !== undefined
                ? `best ${best[set.id]}/${set.items.length}`
                : "not run"}
            </Tag>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SetRunner({ set }: { set: DrillSet }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<DrillAnswer | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }, [set.id]);

  const item = set.items[i];

  const pick = (opt: DrillAnswer) => {
    if (picked) return;
    setPicked(opt);
    if (opt === item.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 >= set.items.length) {
      setDone(true);
      saveProgress({
        drillBest: {
          ...loadProgress().drillBest,
          [set.id]: bestScore(loadProgress().drillBest[set.id] ?? null, score),
        },
      });
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
            {score}/{set.items.length}
          </span>
        </Hex>
        <p className="text-slate-300">
          {drillVerdict(score, set.items.length)}
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => {
              setI(0);
              setPicked(null);
              setScore(0);
              setDone(false);
            }}
            className={`px-5 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white font-medium ${focusRing}`}
          >
            Restart drill
          </button>
          <button
            onClick={() => navigate("/drill")}
            className={`px-5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 ${focusRing}`}
          >
            All drills
          </button>
        </div>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/drill"
            className={`text-xs font-mono text-slate-400 hover:text-slate-200 whitespace-nowrap ${focusRing}`}
          >
            ← drills
          </Link>
          <Tag color="violet">
            {set.title} · {i + 1} / {set.items.length}
          </Tag>
        </div>
        <Tag color="slate">Score {score}</Tag>
      </div>
      <p className="text-sm text-slate-400 mb-2">
        Where does this line belong?
      </p>
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
            {i + 1 >= set.items.length ? "Finish" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DrillModule() {
  const { set: setId } = useParams();
  const set = DRILL_SETS.find((s) => s.id === setId);
  if (!set) return <SetPicker />;
  return <SetRunner set={set} />;
}
