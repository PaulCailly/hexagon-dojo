import { useState } from "react";
import { CARDS } from "../content/cards";
import { Tag } from "../components/Tag";
import { focusRing } from "../components/focus";
import { loadProgress, saveProgress } from "../lib/storage";

export default function CardsModule() {
  const [filter, setFilter] = useState("All");
  const [flipped, setFlipped] = useState<Set<number>>(
    () => new Set(loadProgress().flippedCards),
  );
  const cats = ["All", ...new Set(CARDS.map((c) => c.cat))];
  const visible = CARDS.filter((c) => filter === "All" || c.cat === filter);

  const flip = (idx: number) => {
    const next = new Set(flipped);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setFlipped(next);
    saveProgress({ flippedCards: [...next] });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            aria-pressed={filter === c}
            className={`px-3 py-1 rounded-full text-xs border font-mono ${focusRing} ${
              filter === c
                ? "bg-slate-100 text-slate-900 border-slate-100"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {visible.map((card) => {
          const idx = CARDS.indexOf(card);
          const isFlipped = flipped.has(idx);
          return (
            <button
              key={idx}
              onClick={() => flip(idx)}
              aria-expanded={isFlipped}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${focusRing} ${
                isFlipped
                  ? "border-slate-600 bg-slate-900"
                  : "border-slate-700 bg-slate-950 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Tag color={card.color}>{card.cat}</Tag>
                <span className="text-xs text-slate-400 font-mono">
                  {isFlipped ? "tap to hide" : "tap to reveal"}
                </span>
              </div>
              <p className="font-medium text-slate-100">{card.q}</p>
              {isFlipped && (
                <p className="mt-3 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                  {card.a}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
