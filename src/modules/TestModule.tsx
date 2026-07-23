import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { TEST_MISSIONS } from "../content/testing";
import { Code } from "../components/Code";
import { Tag } from "../components/Tag";
import { focusRing } from "../components/focus";
import { loadProgress, saveProgress } from "../lib/storage";

export default function TestModule() {
  const navigate = useNavigate();
  const { mission: missionId } = useParams();
  const mission =
    TEST_MISSIONS.find((m) => m.id === missionId) ?? TEST_MISSIONS[0];
  const [checklists, setChecklists] = useState<Record<string, Set<number>>>(
    () => {
      const stored = loadProgress().testChecklists;
      return Object.fromEntries(
        TEST_MISSIONS.map((m) => [m.id, new Set(stored[m.id] ?? [])]),
      );
    },
  );
  const [showSolution, setShowSolution] = useState(false);

  const checks = checklists[mission.id];

  const toggle = (idx: number) => {
    const next = new Set(checks);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    const all = { ...checklists, [mission.id]: next };
    setChecklists(all);
    saveProgress({
      testChecklists: Object.fromEntries(
        Object.entries(all).map(([id, s]) => [id, [...s]]),
      ),
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {TEST_MISSIONS.map((m, idx) => (
          <button
            key={m.id}
            onClick={() => {
              navigate(`/testing/${m.id}`);
              setShowSolution(false);
            }}
            aria-pressed={m.id === mission.id}
            className={`px-3 py-1 rounded-full text-xs font-mono border ${focusRing} ${
              m.id === mission.id
                ? "bg-emerald-900 border-emerald-600 text-emerald-200"
                : "bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-700"
            }`}
          >
            Mission {idx + 1}
          </button>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">
        {mission.title}
      </h3>
      <p className="text-sm text-slate-400 mb-4">{mission.brief}</p>
      <div className="space-y-2 mb-4">
        {mission.checklist.map((c, idx) => (
          <button
            key={idx}
            onClick={() => toggle(idx)}
            aria-pressed={checks.has(idx)}
            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${focusRing} ${
              checks.has(idx)
                ? "border-emerald-500 bg-emerald-950 text-emerald-100"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-700"
            }`}
          >
            <span className="font-mono mr-2">
              {checks.has(idx) ? "✔" : "◻"}
            </span>
            {c}
          </button>
        ))}
      </div>
      <Tag
        color={checks.size === mission.checklist.length ? "emerald" : "slate"}
      >
        {checks.size} / {mission.checklist.length} checklist items
      </Tag>
      <div className="mt-4">
        <button
          onClick={() => setShowSolution(!showSolution)}
          aria-expanded={showSolution}
          className={`px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium ${focusRing}`}
        >
          {showSolution ? "Hide model answer" : "Show model answer"}
        </button>
        {showSolution && (
          <div className="mt-4">
            <Code>{mission.solution}</Code>
            <p className="text-sm text-slate-400 mt-3">
              The hand-rolled test infrastructure is the detail worth mentioning
              out loud: once the boundary is real, no mocking library is needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
