import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app";
import { LoginPage } from "./features/auth/login-page";
import { SignupPage } from "./features/auth/signup-page";
import { VerifyOtpPage } from "./features/auth/verify-otp-page";
import { ProtectedRoute } from "./features/auth/protected-route";
import { TrialPage } from "./features/trial/trial-page";
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
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
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
