import { LayoutDashboard, Inbox, Users, Package, Settings, Send } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { to: "/enquiries", label: "Enquiries", shortLabel: "Enquiries", icon: Inbox },
  { to: "/outreach", label: "Outreach", shortLabel: "Outreach", icon: Send },
  { to: "/clients", label: "Clients", shortLabel: "Clients", icon: Users },
  { to: "/catalog", label: "Catalog", shortLabel: "Catalog", icon: Package },
  { to: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];
