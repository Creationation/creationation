import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "@/hooks/useLang";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProspects from "./pages/AdminProspects";
import AdminSequences from "./pages/AdminSequences";
import AdminProjects from "./pages/AdminProjects";
import AdminCosts from "./pages/AdminCosts";
import AdminClients from "./pages/AdminClients";
import AdminRevenues from "./pages/AdminRevenues";
import AdminInvoices from "./pages/AdminInvoices";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LangProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/prospects" element={<AdminProspects />} />
            <Route path="/admin/sequences" element={<AdminSequences />} />
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/admin/revenues" element={<AdminRevenues />} />
            <Route path="/admin/costs" element={<AdminCosts />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
