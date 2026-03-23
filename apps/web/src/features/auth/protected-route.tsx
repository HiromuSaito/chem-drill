import { Navigate, Outlet } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authClient } from "@/auth-client";

export function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
