import { useState } from "react";
import { TEST_CHECKLIST, TEST_SOLUTION } from "../content/testing";
import { Code } from "../components/Code";
import { Tag } from "../components/Tag";
import { focusRing } from "../components/focus";
import { loadProgress, saveProgress } from "../lib/storage";

export default function TestModule() {
  const [checks, setChecks] = useState<Set<number>>(
    () => new Set(loadProgress().testChecklist),
  );
  const [showSolution, setShowSolution] = useState(false);

  const toggle = (idx: number) => {
    const next = new Set(checks);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setChecks(next);
    saveProgress({ testChecklist: [...next] });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">
        Mission: test redeemReward without mocking anything
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        On paper or in your editor, write the test suite for
        createRedeemRewardUseCase from the guide. Cover the happy path and both
        error paths. Then grade yourself against the checklist and compare with
        the model answer.
      </p>
      <div className="space-y-2 mb-4">
        {TEST_CHECKLIST.map((c, idx) => (
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
      <Tag color={checks.size === TEST_CHECKLIST.length ? "emerald" : "slate"}>
        {checks.size} / {TEST_CHECKLIST.length} checklist items
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
            <Code>{TEST_SOLUTION}</Code>
            <p className="text-sm text-slate-400 mt-3">
              The recording adapter is the detail worth mentioning out loud: it
              is a hand-rolled spy, which proves you do not need a mocking
              library once the boundary is real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
