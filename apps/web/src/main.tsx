import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/app-layout";
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
import { QuestionListPage } from "./features/admin/questions/question-list-page";
import { QuestionDetailPage } from "./features/admin/questions/question-detail-page";
import { UserListPage } from "./features/admin/users/user-list-page";
import { UserDetailPage } from "./features/admin/users/user-detail-page";
import { CategorySelectPage } from "./features/drill/category-select-page";
import { DrillPage } from "./features/drill/drill-page";
import { StatsPage } from "./features/stats/stats-page";
import { AccountPage } from "./features/account/account-page";
import { UserProposalListPage } from "./features/proposals/proposal-list-page";
import { UserProposalNewPage } from "./features/proposals/proposal-new-page";
import { UserProposalDetailPage } from "./features/proposals/proposal-detail-page";
import { PrivacyPage } from "./features/legal/privacy-page";
import { TermsPage } from "./features/legal/terms-page";
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
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<CategorySelectPage />} />
              <Route path="/drill" element={<DrillPage />} />
              <Route path="/proposals" element={<UserProposalListPage />} />
              <Route path="/proposals/new" element={<UserProposalNewPage />} />
              <Route
                path="/proposals/:id"
                element={<UserProposalDetailPage />}
              />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
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
                <Route path="questions" element={<QuestionListPage />} />
                <Route path="questions/:id" element={<QuestionDetailPage />} />
                <Route path="categories" element={<CategoryListPage />} />
                <Route path="users" element={<UserListPage />} />
                <Route path="users/:id" element={<UserDetailPage />} />
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
