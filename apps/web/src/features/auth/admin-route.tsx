import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authClient } from "@/auth-client";

export function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session?.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
