import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app";
import { LoginPage } from "./features/auth/login-page";
import { SignupPage } from "./features/auth/signup-page";
import { VerifyOtpPage } from "./features/auth/verify-otp-page";
import { ProtectedRoute } from "./features/auth/protected-route";
import { TrialPage } from "./features/trial/trial-page";
import { AdminRoute } from "./features/auth/admin-route";
import { AdminLayout } from "./features/admin/admin-layout";
import { ProposalListPage } from "./features/admin/proposals/proposal-list-page";
import { ProposalNewPage } from "./features/admin/proposals/proposal-new-page";
import { ProposalGeneratePage } from "./features/admin/proposals/proposal-generate-page";
import { ProposalDetailPage } from "./features/admin/proposals/proposal-detail-page";
import { CategoryListPage } from "./features/admin/categories/category-list-page";
import "./index.css";

function Root() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/trial" element={<TrialPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<App />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="proposals" replace />} />
                <Route path="proposals" element={<ProposalListPage />} />
                <Route path="proposals/new" element={<ProposalNewPage />} />
                <Route
                  path="proposals/generate"
                  element={<ProposalGeneratePage />}
                />
                <Route path="proposals/:id" element={<ProposalDetailPage />} />
                <Route path="categories" element={<CategoryListPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
