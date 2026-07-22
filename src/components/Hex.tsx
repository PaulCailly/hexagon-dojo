import type { CSSProperties, ReactNode } from "react";

export const Hex = ({
  children,
  className = "",
  style = {},
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <div
    className={`flex items-center justify-center ${className}`}
    style={{
      clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
      ...style,
    }}
  >
    {children}
  </div>
);
