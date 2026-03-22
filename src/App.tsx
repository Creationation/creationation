import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "@/hooks/useLang";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/admin/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProspects from "./pages/AdminProspects";
import AdminSequences from "./pages/AdminSequences";
import AdminProjects from "./pages/AdminProjects";
import AdminCosts from "./pages/AdminCosts";
import AdminClients from "./pages/AdminClients";
import AdminRevenues from "./pages/AdminRevenues";
import AdminInvoices from "./pages/AdminInvoices";
import AdminPortfolio from "./pages/AdminPortfolio";

// Portal (lazy loaded)
const PortalLogin = lazy(() => import("./pages/PortalLogin"));
const PortalLayout = lazy(() => import("./components/portal/PortalLayout"));
const PortalDashboard = lazy(() => import("./pages/PortalDashboard"));
const PortalProject = lazy(() => import("./pages/PortalProject"));
const PortalMessages = lazy(() => import("./pages/PortalMessages"));
const PortalInvoices = lazy(() => import("./pages/PortalInvoices"));
const PortalFiles = lazy(() => import("./pages/PortalFiles"));
const PortalProfile = lazy(() => import("./pages/PortalProfile"));

const queryClient = new QueryClient();

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
    <div style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Chargement...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LangProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/prospects" element={<AdminRoute><AdminProspects /></AdminRoute>} />
              <Route path="/admin/sequences" element={<AdminRoute><AdminSequences /></AdminRoute>} />
              <Route path="/admin/projects" element={<AdminRoute><AdminProjects /></AdminRoute>} />
              <Route path="/admin/clients" element={<AdminRoute><AdminClients /></AdminRoute>} />
              <Route path="/admin/invoices" element={<AdminRoute><AdminInvoices /></AdminRoute>} />
              <Route path="/admin/revenues" element={<AdminRoute><AdminRevenues /></AdminRoute>} />
              <Route path="/admin/costs" element={<AdminRoute><AdminCosts /></AdminRoute>} />
              <Route path="/admin/portfolio" element={<AdminRoute><AdminPortfolio /></AdminRoute>} />
              {/* Portal */}
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<PortalDashboard />} />
                <Route path="project" element={<PortalProject />} />
                <Route path="messages" element={<PortalMessages />} />
                <Route path="invoices" element={<PortalInvoices />} />
                <Route path="files" element={<PortalFiles />} />
                <Route path="profile" element={<PortalProfile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LangProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
