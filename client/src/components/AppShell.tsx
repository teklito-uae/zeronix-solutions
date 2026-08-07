import { useNavigate, Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "../contexts/AuthContext";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider className="h-svh">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="hidden md:inline-flex" />
            <Separator orientation="vertical" className="hidden h-5 md:block" />
            <span className="text-sm font-medium text-muted-foreground truncate">Zeronix Quote Builder</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto md:hidden"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut />
            </Button>
          </header>
          <div className="flex-1 overflow-y-auto bg-muted/30 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <Outlet />
          </div>
        </SidebarInset>
        <MobileBottomNav />
      </SidebarProvider>
    </TooltipProvider>
  );
}
