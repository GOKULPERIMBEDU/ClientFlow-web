import { Providers } from "@/components/providers";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ClientsPage } from "@/pages/ClientsPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { TasksPage } from "@/pages/TasksPage";
import { TeamPage } from "@/pages/TeamPage";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";

function RedirectHashRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#/")) {
      return;
    }
    navigate(hash.slice(1), { replace: true });
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <RedirectHashRoutes />
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
