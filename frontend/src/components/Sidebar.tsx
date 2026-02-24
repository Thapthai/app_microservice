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

type SubMenuItem = {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  description: string;
  submenu?: SubMenuItem[];
};

type MenuItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  submenu?: SubMenuItem[];
  /** เมื่อเป็น true กดแล้วไม่นำทาง แค่เปิด/ปิด submenu */
  noHref?: boolean;
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
    href: "/admin/items",
    icon: Box,
    description: "จัดการอุปกรณ์และสต๊อก",
    noHref: true,
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
        name: "เบิกอุปกรณ์จากตู้",
        href: "/admin/dispense-from-cabinet",
        description: "การเบิกอุปกรณ์จากตู้ SmartCabinet",
        icon: FileBarChart,
      },
      {
        name: "เติมอุปกรณ์เข้าตู้",
        href: "/admin/return-to-cabinet-report",
        description: "การเติมอุปกรณ์เข้าตู้ SmartCabinet",
        icon: FileBarChart,
      },
      {
        name: "เบิกอุปกรณ์กับคนไข้",
        href: "/admin/medical-supplies",
        description: "รายการเบิกอุปกรณ์กับคนไข้",
        icon: ClipboardList,
        submenu: [
          {
            name: "แจ้งอุปกรณ์ที่ไม่ถูกใช้งาน",
            href: "/admin/medical-supplies/return",
            description: "แจ้งอุปกรณ์ที่ไม่ถูกใช้งาน / ชำรุด",
            icon: RotateCcw,
          },
        ],
      },
      {
        name: "เปรียบเทียบตามเวชภัณฑ์",
        href: "/admin/item-comparison",
        description: "เปรียบเทียบการเบิกกับการใช้งานตามเวชภัณฑ์",
        icon: FileBarChart,
      },

    ],
  },
  // {
  //   name: "รายงาน",
  //   href: "/reports",
  //   icon: FileBarChart,
  //   description: "รายงานและสถิติต่างๆ",
  //   submenu: [
  //     {
  //       name: "รายงาน Vending",
  //       href: "/admin/reports/vending-reports",
  //       description: "รายงานการ Mapping และการเบิกอุปกรณ์จาก Vending",
  //       icon: TrendingUp,
  //     },
  //     {
  //       name: "รายงานยกเลิก Bill",
  //       href: "/admin/reports/cancel-bill-report",
  //       description: "รายงานการยกเลิก Bill และใบเสร็จ",
  //       icon: Receipt,
  //     },
  //     {
  //       name: "คืนเวชภัณฑ์",
  //       href: "/admin/reports/return-report",
  //       description: "รายงานอุปกรณ์ที่ไม่ถูกใช้งาน",
  //       icon: RotateCcw,
  //     },
  //   ],
  // },
  {
    name: "การจัดการ",
    href: "/admin/management",
    icon: Settings,
    description: "จัดการระบบ",
    noHref: true,
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
        name: "Staff Permission Role",
        href: "/admin/management/permission-role",
        icon: Users,
        description: "จัดการ Staff Permission Role",
      },
    ],
  },
  {
    name: "ประวัติการใช้งาน",
    href: "/admin/logs-history",
    icon: ClipboardList,
    description: "ประวัติการใช้งานระบบ",

  }
];



function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function isSubmenuActive(pathname: string, sub: SubMenuItem): boolean {
  if (isPathActive(pathname, sub.href)) return true;
  return (sub.submenu ?? []).some((s) => isSubmenuActive(pathname, s));
}

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
          "fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl overflow-x-hidden",
          "transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed ? "lg:w-16" : "w-64 lg:w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className={cn("flex items-center justify-between border-b border-slate-700/50 transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] p-4", isCollapsed && "lg:p-2")}>
            {!isCollapsed && (
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-3 flex-1 min-w-0"
              >
                <div className="w-45 h-15 rounded-lg bg-white flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden ring-1 ring-slate-600/50 p-1">
                  <img
                    src={ASSETS.LOGO}
                    alt="POSE Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

              </Link>
            )}
            {isCollapsed && (
              <Link
                href="/admin/dashboard"
                className="w-50 h-15 rounded-lg bg-white flex items-center justify-center mx-auto shadow-lg overflow-hidden ring-1 ring-slate-600/50 p-1"
              >
                <img
                  src={ASSETS.LOGO}
                  alt="POSE"
                  className="w-full h-full object-contain"
                />
              </Link>
            )}
            <button
              type="button"
              onClick={() =>
                isMobileOpen ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed)
              }
              className="hidden lg:flex flex-shrink-0 items-center justify-center w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors duration-200"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
              )}
            </button>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.submenu?.length;
              const isActive =
                isPathActive(pathname, item.href) ||
                (hasSubmenu && item.submenu!.some((s) => isSubmenuActive(pathname, s)));
              const open = openSubmenus[item.href] ?? true;

              return (
                <div key={item.href}>
                  <div
                    className={cn(
                      "flex items-center w-full rounded-xl",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 hover:text-white",
                      isCollapsed && "lg:justify-center lg:px-2"
                    )}
                  >
                    {item.noHref && hasSubmenu ? (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenSubmenus((p) => ({ ...p, [item.href]: !open }));
                          setIsMobileOpen(false);
                        }}
                        className={cn(
                          "flex items-center flex-1 min-w-0 px-3 py-3 text-sm font-medium rounded-xl text-left cursor-pointer",
                          isActive ? "text-white" : "text-inherit hover:text-white",
                          isCollapsed && "lg:justify-center lg:px-2"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-200", isActive ? "text-white" : "text-slate-300", isCollapsed ? "lg:mx-auto" : "mr-3")} />
                        <span className={cn("flex-1 text-left truncate transition-opacity duration-200", isCollapsed && "lg:opacity-0 lg:w-0 lg:min-w-0 lg:overflow-hidden")}>{item.name}</span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center flex-1 min-w-0 px-3 py-3 text-sm font-medium rounded-xl",
                          isActive ? "text-white" : "text-inherit hover:text-white",
                          isCollapsed && "lg:justify-center lg:px-2"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-200", isActive ? "text-white" : "text-slate-300", isCollapsed ? "lg:mx-auto" : "mr-3")} />
                        <span className={cn("flex-1 text-left truncate transition-opacity duration-200", isCollapsed && "lg:opacity-0 lg:w-0 lg:min-w-0 lg:overflow-hidden")}>{item.name}</span>
                      </Link>
                    )}
                    {hasSubmenu && !isCollapsed && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenSubmenus((p) => ({ ...p, [item.href]: !open }));
                        }}
                        className={cn(
                          "flex-shrink-0 p-2 rounded-lg text-inherit hover:bg-white/10 transition-colors",
                          isActive && "text-white"
                        )}
                        aria-expanded={open}
                        aria-label={open ? "ปิดเมนูย่อย" : "เปิดเมนูย่อย"}
                      >
                        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-90")} />
                      </button>
                    )}
                  </div>
                  {hasSubmenu && !isCollapsed && open && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-slate-700/50 pl-4">
                      {item.submenu!.map((sub) => {
                        const SubIcon = sub.icon;
                        const hasNested = (sub.submenu?.length ?? 0) > 0;
                        const subActive = isSubmenuActive(pathname, sub);
                        const nestedKey = `${item.href}__${sub.href}`;
                        const nestedOpen = openSubmenus[nestedKey] ?? subActive;

                        if (hasNested) {
                          return (
                            <div key={sub.href}>
                              <div
                                className={cn(
                                  "flex items-center rounded-lg",
                                  subActive ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500" : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-200"
                                )}
                              >
                                <Link
                                  href={sub.href}
                                  onClick={() => setIsMobileOpen(false)}
                                  className="flex flex-1 min-w-0 items-center px-3 py-2 text-sm rounded-lg text-inherit"
                                >
                                  {SubIcon ? <SubIcon className="h-4 w-4 mr-2 flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" />}
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenSubmenus((p) => ({ ...p, [nestedKey]: !nestedOpen }));
                                  }}
                                  className="flex-shrink-0 p-1.5 rounded text-inherit hover:bg-white/10"
                                  aria-expanded={nestedOpen}
                                  aria-label={nestedOpen ? "ปิดเมนูย่อย" : "เปิดเมนูย่อย"}
                                >
                                  <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", nestedOpen && "rotate-90")} />
                                </button>
                              </div>
                              {nestedOpen && (
                                <div className="ml-3 mt-1 space-y-1 border-l border-slate-600/50 pl-3">
                                  {sub.submenu!.map((inner) => {
                                    const InnerIcon = inner.icon;
                                    const innerActive = isPathActive(pathname, inner.href);
                                    return (
                                      <Link
                                        key={inner.href}
                                        href={inner.href}
                                        onClick={() => setIsMobileOpen(false)}
                                        className={cn(
                                          "flex items-center px-3 py-2 text-sm rounded-lg",
                                          innerActive ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500" : "text-slate-400 hover:bg-slate-700/30 hover:text-slate-200"
                                        )}
                                      >
                                        {InnerIcon ? <InnerIcon className="h-4 w-4 mr-2 flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" />}
                                        <span>{inner.name}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

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

          <div className={cn("p-4 border-t border-slate-700/50 transition-all duration-300", isCollapsed && "lg:px-2")}>
            <div className={cn("flex items-center gap-2 text-slate-400 overflow-hidden", isCollapsed && "lg:justify-center")}>
              <img src={ASSETS.LOGO} alt="POSE" width={20} height={20} className="object-contain flex-shrink-0" />
              <span className={cn("text-[10px] font-medium whitespace-nowrap transition-opacity duration-200", isCollapsed && "lg:opacity-0 lg:w-0 lg:min-w-0 lg:overflow-hidden")}>© 2026 POSE Intelligence</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
