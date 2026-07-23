import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { BOOK, BOOK_PARTS } from "../content/book";
import { Code } from "../components/Code";
import { Hex } from "../components/Hex";
import { Tag } from "../components/Tag";
import { focusRing } from "../components/focus";
import { loadProgress, saveProgress } from "../lib/storage";

const scrollToTop = () => {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
};

export default function BookModule() {
  const navigate = useNavigate();
  const { chapter } = useParams();
  const ch = Math.min(Math.max((Number(chapter) || 1) - 1, 0), BOOK.length - 1);
  const [read, setRead] = useState<Set<number>>(
    () => new Set(loadProgress().readChapters),
  );
  const current = BOOK[ch];

  const markRead = () => {
    const next = new Set(read).add(ch);
    setRead(next);
    saveProgress({ readChapters: [...next] });
  };

  const markAndGo = (next: number) => {
    markRead();
    navigate(`/book/${next + 1}`);
    scrollToTop();
  };

  return (
    <div>
      <div className="mb-5 space-y-2">
        {BOOK_PARTS.map((part) => (
          <div key={part.title}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              {part.title}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {BOOK.slice(part.from, part.to + 1).map((c, i) => {
                const idx = part.from + i;
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(`/book/${idx + 1}`)}
                    title={c.title}
                    aria-label={`Chapter ${idx + 1}: ${c.title}`}
                    aria-current={idx === ch ? "page" : undefined}
                    className={`${focusRing} rounded`}
                  >
                    <Hex
                      className={`w-9 h-9 text-xs font-bold transition-colors ${
                        idx === ch
                          ? "bg-cyan-500 text-slate-950"
                          : read.has(idx)
                            ? "bg-emerald-800 text-emerald-200"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {idx + 1}
                    </Hex>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs font-mono text-slate-400 mb-1">
        Chapter {ch + 1} of {BOOK.length}
      </p>
      <h2 className="text-2xl font-bold text-slate-50 mb-5">{current.title}</h2>

      <div className="space-y-4">
        {current.blocks.map((b, idx) => {
          if (b.t === "p")
            return (
              <p key={idx} className="text-slate-300 leading-relaxed">
                {b.c}
              </p>
            );
          if (b.t === "code") return <Code key={idx}>{b.c}</Code>;
          if (b.t === "li")
            return (
              <ul key={idx} className="space-y-2 pl-1">
                {b.c.map((item, j) => (
                  <li
                    key={j}
                    className="text-slate-300 leading-relaxed flex gap-3"
                  >
                    <span className="text-cyan-500 flex-shrink-0 mt-0.5">
                      ⬡
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          if (b.t === "take")
            return (
              <div
                key={idx}
                className="border-l-4 border-cyan-500 bg-slate-900 rounded-r-lg p-4"
              >
                <p className="text-xs font-mono text-cyan-400 mb-1">
                  KEY TAKEAWAY
                </p>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {b.c}
                </p>
              </div>
            );
          return null;
        })}
      </div>

      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
        <button
          onClick={() => markAndGo(Math.max(0, ch - 1))}
          disabled={ch === 0}
          className={`px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 disabled:opacity-30 disabled:hover:border-slate-700 ${focusRing}`}
        >
          ← {ch > 0 ? BOOK[ch - 1].title : "Start"}
        </button>
        <Tag color={read.size >= BOOK.length ? "emerald" : "slate"}>
          {read.size} / {BOOK.length} read
        </Tag>
        {ch < BOOK.length - 1 ? (
          <button
            onClick={() => markAndGo(ch + 1)}
            className={`px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium ${focusRing}`}
          >
            {BOOK[ch + 1].title} →
          </button>
        ) : (
          <button
            onClick={markRead}
            className={`px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium ${focusRing}`}
          >
            Finish → go train
          </button>
        )}
      </div>
    </div>
  );
}
