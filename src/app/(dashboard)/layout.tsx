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
          {/* min-w-0: grid items refuse to shrink below their content width by
              default, so the 9-tab mobile nav row was forcing the whole page
              to ~750px wide on phones (breaking the layout + hiding the tab bar) */}
          <main className="min-w-0 pb-28 sm:pb-0">
            <DashboardMobileNav />
            {children}
          </main>
        </div>
      </Container>
      <MobileTabBar />
    </>
  );
}
