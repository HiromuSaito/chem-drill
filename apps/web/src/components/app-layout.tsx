import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FlaskConical,
  LogOut,
  Shield,
  BookOpen,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { authClient } from "@/auth-client";
import { UserIcon } from "@/components/user-icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { LegalFooter } from "@/components/legal-footer";

const navItems = [
  { to: "/", label: "ドリル", icon: BookOpen },
  { to: "/proposals", label: "出題案", icon: Lightbulb },
  { to: "/stats", label: "成績", icon: BarChart3 },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                    <FlaskConical className="size-4" />
                  </div>
                  <span className="text-base font-semibold">Chem Drill</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        to === "/"
                          ? location.pathname === "/" ||
                            location.pathname.startsWith("/drill")
                          : location.pathname.startsWith(to)
                      }
                      tooltip={label}
                    >
                      <Link to={to}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            {session?.user.role === "admin" && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="管理画面">
                  <Link to="/admin">
                    <Shield />
                    <span>管理画面</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/account"}
                tooltip="アカウント設定"
              >
                <Link to="/account">
                  <UserIcon
                    name={session?.user.name ?? ""}
                    image={session?.user.image}
                    size="sm"
                  />
                  <span>アカウント設定</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} tooltip="ログアウト">
                <LogOut />
                <span>ログアウト</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <LegalFooter className="mt-2 pb-1" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="max-h-svh overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground">
            {location.pathname === "/account"
              ? "アカウント設定"
              : navItems.find(
                  (item) =>
                    location.pathname === item.to ||
                    location.pathname.startsWith(
                      item.to === "/" ? "/drill" : item.to,
                    ),
                )?.label}
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
