import "./global.css";

// Auto-prefix /api calls with VITE_API_URL when deploying frontend separately
// e.g. frontend on prisville.com, backend on api.prisville.com
const API_BASE = import.meta.env.VITE_API_URL || '';
if (API_BASE) {
  const _origFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return _origFetch(API_BASE + input, init);
    }
    return _origFetch(input, init);
  };
}

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import ReceptionistInventory from "./pages/ReceptionistInventory";
import Debug from "./pages/Debug";
import Announcements from "./pages/Announcements";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import { useSiteSettings } from "./hooks/use-site-settings";

const queryClient = new QueryClient();

const AppContent = () => {
  // Load and apply site settings globally
  useSiteSettings();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/debug" element={<Debug />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
        <Route path="/receptionist/inventory" element={<ReceptionistInventory />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
