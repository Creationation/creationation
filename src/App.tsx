import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "@/hooks/useLang";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Impressum from "./pages/Impressum";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminSupportDashboard from "./pages/AdminSupportDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProspects from "./pages/AdminProspects";
import AdminSequences from "./pages/AdminSequences";
import AdminProjects from "./pages/AdminProjects";
import AdminCosts from "./pages/AdminCosts";
import AdminExpenses from "./pages/AdminExpenses";
import AdminClients from "./pages/AdminClients";
import AdminClientsCRM from "./pages/AdminClientsCRM";
import AdminRevenues from "./pages/AdminRevenues";
import AdminInvoices from "./pages/AdminInvoices";
import AdminPortfolio from "./pages/AdminPortfolio";
import AdminTickets from "./pages/AdminTickets";
import AdminTimeTracking from "./pages/AdminTimeTracking";
import AdminNotes from "./pages/AdminNotes";
import AdminServices from "./pages/AdminServices";
import AdminContracts from "./pages/AdminContracts";
import AdminSettings from "./pages/AdminSettings";
import ViewAsClientLayout from "./components/admin/ViewAsClientLayout";
import CaseStudy from "./pages/CaseStudy";

// Portal (lazy loaded)
const PortalLogin = lazy(() => import("./pages/PortalLogin"));
const PortalLayout = lazy(() => import("./components/portal/PortalLayout"));
const PortalDashboard = lazy(() => import("./pages/PortalDashboard"));
const PortalProject = lazy(() => import("./pages/PortalProject"));
const PortalTickets = lazy(() => import("./pages/PortalTickets"));
const PortalTicketDetail = lazy(() => import("./pages/PortalTicketDetail"));
const PortalMessages = lazy(() => import("./pages/PortalMessages"));
const PortalInvoices = lazy(() => import("./pages/PortalInvoices"));
const PortalFiles = lazy(() => import("./pages/PortalFiles"));
const PortalProfile = lazy(() => import("./pages/PortalProfile"));

const queryClient = new QueryClient();

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
    <div style={{ fontFamily: 'var(--font-b)', color: 'var(--text-light)' }}>Loading...</div>
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
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/portfolio/:slug" element={<CaseStudy />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              {/* Admin with sidebar layout */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminSupportDashboard />} />
                <Route path="prospects" element={<AdminProspects />} />
                <Route path="sequences" element={<AdminSequences />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="clients" element={<AdminClients />} />
                <Route path="clients-crm" element={<AdminClientsCRM />} />
                <Route path="invoices" element={<AdminInvoices />} />
                <Route path="revenues" element={<AdminRevenues />} />
                <Route path="costs" element={<AdminCosts />} />
                <Route path="expenses" element={<AdminExpenses />} />
                <Route path="portfolio" element={<AdminPortfolio />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="time-tracking" element={<AdminTimeTracking />} />
                <Route path="notes" element={<AdminNotes />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="contracts" element={<AdminContracts />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              {/* Admin View-as-Client */}
              <Route path="/admin/view-as/:clientId" element={<AdminRoute><ViewAsClientLayout /></AdminRoute>}>
                <Route index element={<PortalDashboard />} />
                <Route path="tickets" element={<PortalTickets />} />
                <Route path="tickets/:id" element={<PortalTicketDetail />} />
                <Route path="project" element={<PortalProject />} />
                <Route path="profile" element={<PortalProfile />} />
              </Route>
              {/* Portal */}
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<PortalDashboard />} />
                <Route path="tickets" element={<PortalTickets />} />
                <Route path="tickets/:id" element={<PortalTicketDetail />} />
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
