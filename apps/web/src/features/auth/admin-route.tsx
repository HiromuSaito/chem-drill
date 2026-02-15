import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "@/auth-client";

export function AdminRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (session?.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
