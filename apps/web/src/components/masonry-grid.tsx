"use client";

import { ReactNode, Children } from "react";

export function MasonryGrid({
  children,
  columns = { default: 4, sm: 3, mobile: 2 },
}: {
  children: ReactNode;
  columns?: { default: number; sm: number; mobile: number };
}) {
  const items = Children.toArray(children);

  // Distribute items round-robin across columns (left-to-right, row by row)
  const distribute = (colCount: number) => {
    const cols: ReactNode[][] = Array.from({ length: colCount }, () => []);
    items.forEach((item, i) => {
      cols[i % colCount].push(item);
    });
    return cols;
  };

  return (
    <>
      {/* Mobile: 2 columns */}
      <div className="flex gap-3 sm:hidden">
        {distribute(columns.mobile).map((col, i) => (
          <div key={i} className="flex-1 flex flex-col gap-3">
            {col}
          </div>
        ))}
      </div>
      {/* Tablet: 3 columns */}
      <div className="hidden sm:flex lg:hidden gap-3">
        {distribute(columns.sm).map((col, i) => (
          <div key={i} className="flex-1 flex flex-col gap-3">
            {col}
          </div>
        ))}
      </div>
      {/* Desktop: 4 columns */}
      <div className="hidden lg:flex gap-3">
        {distribute(columns.default).map((col, i) => (
          <div key={i} className="flex-1 flex flex-col gap-3">
            {col}
          </div>
        ))}
      </div>
    </>
  );
}
