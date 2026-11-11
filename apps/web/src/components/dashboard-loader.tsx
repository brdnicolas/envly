"use client";

import dynamic from "next/dynamic";

const DashboardView = dynamic(
  () => import("@/components/dashboard-view").then((m) => m.DashboardView),
  { ssr: false }
);

export function DashboardLoader() {
  return <DashboardView />;
}
