import { Link, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            className="flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                isActive ? "bg-accent text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-[18px]" />
            </span>
            <span
              className={cn(
                "w-full truncate px-0.5 text-center text-[10px] leading-none",
                isActive ? "font-medium text-primary" : "text-muted-foreground"
              )}
            >
              {item.shortLabel}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
