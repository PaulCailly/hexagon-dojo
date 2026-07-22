import type { ReactNode } from "react";

export const Code = ({ children }: { children: ReactNode }) => (
  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed text-slate-200 font-mono whitespace-pre">
    {children}
  </pre>
);
