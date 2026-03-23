import { Navigate, Outlet } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authClient } from "@/auth-client";

export function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (session?.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
