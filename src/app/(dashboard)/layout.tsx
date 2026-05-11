import { Navbar } from "@/components/layout/Navbar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardMobileNav } from "@/components/layout/DashboardMobileNav";
import { Container } from "@/components/layout/Container";
import { requireProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProfile();

  return (
    <>
      <Navbar />
      <Container className="py-4 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <DashboardSidebar />
          <main className="pb-28 sm:pb-0">
            <DashboardMobileNav />
            {children}
          </main>
        </div>
      </Container>
      <MobileTabBar />
    </>
  );
}
