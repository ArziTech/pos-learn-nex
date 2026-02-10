import { Sidebar, Header, Footer, MobileNav } from "@/components/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 bg-muted/10">{children}</main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileNav />
    </div>
  );
}
