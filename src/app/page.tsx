import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LandingPage } from "@/components/landing-page";
import { DashboardView } from "@/components/dashboard-view";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    return <DashboardView />;
  }

  return <LandingPage />;
}
