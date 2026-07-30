import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { QuoteEditorPage } from "./pages/QuoteEditorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { CatalogPage } from "./pages/CatalogPage";
import { ClientsPage } from "./pages/ClientsPage";
import { EnquiriesPage } from "./pages/EnquiriesPage";
import { EnquiryEditorPage } from "./pages/EnquiryEditorPage";
import { OutreachCampaignsPage } from "./pages/OutreachCampaignsPage";
import { OutreachCampaignBuilderPage } from "./pages/OutreachCampaignBuilderPage";
import { OutreachProspectPage } from "./pages/OutreachProspectPage";
import { OutreachMailboxesPage } from "./pages/OutreachMailboxesPage";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/quotes/:id" element={<QuoteEditorPage />} />
              <Route path="/enquiries" element={<EnquiriesPage />} />
              <Route path="/enquiries/:id" element={<EnquiryEditorPage />} />
              <Route path="/outreach" element={<OutreachCampaignsPage />} />
              <Route path="/outreach/mailboxes" element={<OutreachMailboxesPage />} />
              <Route path="/outreach/:id" element={<OutreachCampaignBuilderPage />} />
              <Route path="/outreach/:campaignId/prospects/:id" element={<OutreachProspectPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/clients" element={<ClientsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
