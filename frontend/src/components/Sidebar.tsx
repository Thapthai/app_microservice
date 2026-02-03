"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ASSETS } from "@/lib/assets";
import {
  LayoutDashboard,
  Package,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileBarChart,
  ClipboardList,
  Users,
  Box,
  TrendingUp,
  RotateCcw,
  Receipt,
  Network,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

type MenuItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  submenu?: Array<{
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    description: string;
  }>;
};


const mainMenuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "ภาพรวมระบบ",
  },
  {
    name: "อุปกรณ์",
    href: "/equipment",
    icon: Box,
    description: "จัดการอุปกรณ์และสต๊อก",
    submenu: [

      {
        name: "จัดการตู้ Cabinet - แผนก",
        href: "/admin/cabinet-departments",
        icon: Network,
        description: "จัดการตู้ Cabinet และเชื่อมโยงกับแผนก",
      },
      {
        name: "สต๊อกอุปกรณ์ในตู้",
        href: "/admin/items",
        description: "เมนูสต๊อกอุปกรณ์ที่มีในตู้ SmartCabinet",
        icon: Package,
      },

      {
        name: "รายงานเบิกอุปกรณ์จากตู้",
        href: "/admin/dispense-from-cabinet",
        description: "รายงานการเบิกอุปกรณ์จากตู้ SmartCabinet",
        icon: FileBarChart,
      },

      {
        name: "รายการเบิกอุปกรณ์ใช้กับคนไข้",
        href: "/admin/medical-supplies",
        description: "รายการเบิกอุปกรณ์ใช้กับคนไข้",
        icon: ClipboardList,
      },
      {
        name: "รายงานเติมอุปกรณ์จากตู้",
        href: "/admin/return-to-cabinet-report",
        description: "รายงานการเติมอุปกรณ์จากตู้ SmartCabinet",
        icon: FileBarChart,
      },
      {
        name: "เปรียบเทียบตามเวชภัณฑ์",
        href: "/admin/medical-supplies/item-comparison",
        description: "เปรียบเทียบการเบิกกับการใช้งานตามเวชภัณฑ์",
        icon: FileBarChart,
      },

    ],
  },
  {
    name: "รายงาน",
    href: "/reports",
    icon: FileBarChart,
    description: "รายงานและสถิติต่างๆ",
    submenu: [
      {
        name: "รายงาน Vending",
        href: "/admin/reports/vending-reports",
        description: "รายงานการ Mapping และการเบิกอุปกรณ์จาก Vending",
        icon: TrendingUp,
      },
      {
        name: "รายงานยกเลิก Bill",
        href: "/admin/reports/cancel-bill-report",
        description: "รายงานการยกเลิก Bill และใบเสร็จ",
        icon: Receipt,
      },
      {
        name: "คืนเวชภัณฑ์",
        href: "/admin/reports/return-report",
        description: "รายงานการคืนเวชภัณฑ์",
        icon: RotateCcw,
      },
    ],
  },
  {
    name: "การจัดการ",
    href: "/management",
    icon: Settings,
    description: "จัดการระบบ",
    submenu: [
      {
        name: "จัดการตู้ Cabinet",
        href: "/admin/management/cabinets",
        icon: Package,
        description: "จัดการตู้ Cabinet",
      },
      {
        name: "Staff Users",
        href: "/admin/management/staff-users",
        icon: Users,
        description: "จัดการ Staff Users และ Client Credentials",
      },
      {
        name: "Staff Premission Role",
        href: "/admin/management/staff-users/premission-role",
        icon: Users,
        description: "จัดการ Staff Premission Role",
      },
    ],
  },
];



export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({});

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-lg hover:bg-gray-50 border border-gray-200 h-9 w-9 rounded-md flex items-center justify-center"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out shadow-2xl",
          isCollapsed ? "lg:w-16" : "w-64 lg:w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            {!isCollapsed && (
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-3 flex-1 min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                  <img
                    src={ASSETS.LOGO}
                    alt="POSE Logo"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold truncate bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    POSE Intelligence
                  </h2>
                </div>
              </Link>
            )}
            {isCollapsed && (
              <Link
                href="/admin/dashboard"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg overflow-hidden"
              >
                <img
                  src={ASSETS.LOGO}
                  alt="POSE"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </Link>
            )}
            <button
              type="button"
              onClick={() =>
                isMobileOpen ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed)
              }
              className="hidden lg:flex flex-shrink-0 items-center justify-center w-9 h-9 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu?.length;
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/") ||
                (hasSubmenu && item.submenu!.some((s) => pathname === s.href || pathname.startsWith(s.href + "/")));
              const open = openSubmenus[item.href] ?? true;

              return (
                <div key={item.href}>
                  <Link
                    href={hasSubmenu ? "#" : item.href}
                    onClick={(e) => {
                      if (hasSubmenu) {
                        e.preventDefault();
                        setOpenSubmenus((p) => ({ ...p, [item.href]: !open }));
                      } else setIsMobileOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 hover:text-white",
                      isCollapsed && "lg:justify-center lg:px-2"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-slate-300", isCollapsed ? "lg:mx-auto" : "mr-3")} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {hasSubmenu && <ChevronRight className={cn("h-4 w-4 flex-shrink-0", open && "rotate-90")} />}
                      </>
                    )}
                  </Link>
                  {hasSubmenu && !isCollapsed && open && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-slate-700/50 pl-4">
                      {item.submenu!.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-lg",
                              subActive ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500" : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-200"
                            )}
                          >
                            {SubIcon ? <SubIcon className="h-4 w-4 mr-2 flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" />}
                            <span>{sub.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={cn("p-4 border-t border-slate-700/50", isCollapsed && "lg:px-2")}>
            <div className={cn("flex items-center gap-2 text-slate-400", isCollapsed && "lg:justify-center")}>
              <img src={ASSETS.LOGO} alt="POSE" width={20} height={20} className="object-contain flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-[10px] font-medium">© 2026 POSE Intelligence</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
