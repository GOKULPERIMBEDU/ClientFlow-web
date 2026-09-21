import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-72">
        <Header />
        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
