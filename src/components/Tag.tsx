import type { ReactNode } from "react";
import type { TagColor } from "../content/types";

const map: Record<TagColor, string> = {
  cyan: "bg-cyan-950 text-cyan-300 border-cyan-800",
  amber: "bg-amber-950 text-amber-300 border-amber-800",
  violet: "bg-violet-950 text-violet-300 border-violet-800",
  emerald: "bg-emerald-950 text-emerald-300 border-emerald-800",
  slate: "bg-slate-800 text-slate-300 border-slate-700",
};

export const Tag = ({
  color,
  children,
}: {
  color: TagColor | string;
  children: ReactNode;
}) => (
  <span
    className={`inline-block text-xs px-2 py-0.5 rounded-full border font-mono ${map[color as TagColor] || map.slate}`}
  >
    {children}
  </span>
);
