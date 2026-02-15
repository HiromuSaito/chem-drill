import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FileText, FolderOpen, ArrowLeft, LogOut, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/auth-client";

const navItems = [
  { to: "/admin/proposals", label: "問題提案", icon: FileText },
  { to: "/admin/categories", label: "カテゴリ", icon: FolderOpen },
];

export function AdminLayout() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-56 flex-col border-r bg-background">
        <div className="flex items-center gap-2 px-4 py-4">
          <Shield className="size-5 text-primary" />
          <span className="text-sm font-semibold">管理画面</span>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Separator />
        <div className="flex flex-col gap-1 p-2">
          <NavLink
            to="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            クイズに戻る
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            ログアウト
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-muted/40 p-6">
        <Outlet />
      </main>
    </div>
  );
}
