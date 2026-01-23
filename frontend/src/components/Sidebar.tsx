"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ASSETS } from "@/lib/assets";
import {
  LayoutDashboard,
  Package,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Syringe,
  Settings,
  Tag,
  FileBarChart,
  FileText,
  ClipboardList,
  Users,
  Box,
  BarChart3,
  History,
  TrendingUp,
  XCircle,
  RotateCcw,
  Receipt,
  ArrowLeftRight,
  Link as LinkIcon,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const mainMenuItems = [
  {
    name: "Dashboard",
    href: "/medical-supplies/dashboard",
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
        name: "จัดการตู้ Cabinet",
        href: "/admin/cabinets",
        icon: Package,
        description: "จัดการตู้ Cabinet",
      },
      {
        name: "จัดการตู้ Cabinet - แผนก",
        href: "/admin/cabinet-departments",
        icon: LinkIcon,
        description: "จัดการตู้ Cabinet และเชื่อมโยงกับแผนก",
      },
      {
        name: "สต๊อกอุปกรณ์ในตู้",
        href: "/admin/items",
        description: "เมนูสต๊อกอุปกรณ์ที่มีในตู้ SmartCabinet",
        icon: Package,
      },
   
      // {
      //   name: 'คืนเวชภัณฑ์',
      //   href: '/medical-supplies/return',
      //   description: 'คืนอุปกรณ์เข้าตู้ที่เบิกแล้วแต่ไม่ได้ใช้กลับเข้าตู้',
      //   icon: RotateCcw,
      // },

      // {
      //   name: 'เบิกอุปกรณ์จากตู้',
      //   href: '/medical-supplies/dispense-from-cabinet-stock',
      //   description: 'เลือก itemstock ที่เบิกจากตู้',
      //   icon: Package,
      // },
      {
        name: "รายงานเบิกอุปกรณ์จากตู้",
        href: "/admin/medical-supplies/dispense-from-cabinet",
        description: "รายงานการเบิกอุปกรณ์จากตู้ SmartCabinet",
        icon: FileBarChart,
      },
      // {
      //   name: 'คืนอุปกรณ์เข้าตู้',
      //   href: '/medical-supplies/return-to-cabinet',
      //   description: 'เลือก itemstock ที่คืนอุปกรณ์เข้าตู้',
      //   icon: Package,
      // },
      {
        name: "รายการเบิกอุปกรณ์อุปกรณ์ใช้กับคนไข้",
        href: "/admin/medical-supplies",
        description: "รายการเบิกอุปกรณ์อุปกรณ์ใช้กับคนไข้",
        icon: ClipboardList,
      },
      {
        name: "รายงานเติมอุปกรณ์จากตู้",
        href: "/admin/medical-supplies/return-to-cabinet-report",
        description: "รายงานการเติมอุปกรณ์จากตู้ SmartCabinet",
        icon: FileBarChart,
      },
      {
        name: "เปรียบเทียบตามเวชภัณฑ์",
        href: "/admin/medical-supplies/item-comparison",
        description: "เปรียบเทียบการเบิกกับการใช้งานตามเวชภัณฑ์",
        icon: FileBarChart,
      },
      // {
      //   name: 'Cancel Bill ข้ามวัน',
      //   href: '/medical-supplies/cancel-bill',
      //   description: 'จัดการ Cancel Bill ยกเลิกรายการใบเสร็จข้ามวัน',
      //   icon: XCircle,
      // },
      // {
      //   name: 'Transaction',
      //   href: '/medical-supplies/transactions',
      //   description: 'ข้อมูลการบันทึกใช้อุปกรณ์กับคนไข้จาก HIS',
      //   icon: FileText,
      // },
    ],
  },
  {
    name: "รายงาน",
    href: "/reports",
    icon: BarChart3,
    description: "รายงานและสถิติต่างๆ",
    submenu: [
      {
        name: "รายงานทั้งหมด",
        href: "/admin/medical-supplies/reports",
        description: "รายงานทางการแพทย์ทั้งหมด",
        icon: FileBarChart,
      },
      {
        name: "เปรียบเทียบตามผู้ป่วย",
        href: "/admin/medical-supplies/comparison",
        description: "เปรียบเทียบการเบิกกับการใช้งานตามผู้ป่วย",
        icon: FileBarChart,
      },
      // {
      //   name: 'เปรียบเทียบตามเวชภัณฑ์',
      //   href: '/medical-supplies/item-comparison',
      //   description: 'เปรียบเทียบการเบิกกับการใช้งานตามเวชภัณฑ์',
      //   icon: FileBarChart,
      // },
      {
        name: "การใช้อุปกรณ์",
        href: "/admin/medical-supplies/equipment-usage",
        description: "รายงานการใช้อุปกรณ์กับคนไข้",
        icon: ClipboardList,
      },
      {
        name: "การตัดจ่าย",
        href: "/admin/medical-supplies/equipment-disbursement",
        description: "รายงานการรับบันทึกตัดจ่ายอุปกรณ์",
        icon: FileText,
      },
      {
        name: "รายงาน Vending",
        href: "/admin/medical-supplies/vending-reports",
        description: "รายงานการ Mapping และการเบิกอุปกรณ์จาก Vending",
        icon: TrendingUp,
      },
      {
        name: "รายงานยกเลิก Bill",
        href: "/admin/medical-supplies/cancel-bill-report",
        description: "รายงานการยกเลิก Bill และใบเสร็จ",
        icon: Receipt,
      },
      {
        name: "คืนเวชภัณฑ์",
        href: "/admin/medical-supplies/reports/return-report",
        description: "รายงานการคืนเวชภัณฑ์",
        icon: RotateCcw,
      },
    ],
  },
];

const managementMenuItems = [
  {
    name: "การจัดการ",
    href: "/admin",
    icon: Settings,
    description: "จัดการระบบ",
    submenu: [
      {
        name: "Staff Users",
        href: "/admin/staff-users",
        icon: Users,
        description: "จัดการ Staff Users และ Client Credentials",
      },
      {
        name: "Staff Premission Role",
        href: "/admin/staff-users/premission-role",
        icon: Users,
        description: "จัดการ Staff Premission Role",
      },

      {
        name: "โปรไฟล์",
        href: "/profile",
        icon: User,
        description: "ข้อมูลส่วนตัว",
      },
    ],
  },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState<{
    [key: string]: boolean;
  }>({
    "/equipment": true, // เปิด submenu อุปกรณ์ by default
    "/reports": true, // เปิด submenu รายงาน by default
    "/admin": true, // เปิด submenu การจัดการ by default
  });

  const toggleSubmenu = (href: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  return (
    <>
      {/* Mobile Menu Button - แสดงเฉพาะเมื่อ sidebar ปิด */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/30 backdrop-blur-sm group"
        >
          <Menu className="h-5 w-5 text-white drop-shadow-lg group-hover:rotate-180 transition-transform duration-300" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gradient-to-br from-black/60 via-slate-900/50 to-black/60 backdrop-blur-md z-30 transition-all duration-300 animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-all duration-300",
          "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950",
          "border-r border-slate-700/30 shadow-2xl backdrop-blur-xl",
          "before:absolute before:inset-0 before:bg-gradient-to-b before:from-blue-500/5 before:via-transparent before:to-purple-500/5 before:pointer-events-none",
          // Mobile: เสมอ w-64, Desktop: ขึ้นกับ isCollapsed
          "w-64 lg:w-64",
          isCollapsed && "lg:w-16",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="relative h-16 px-4 border-b border-slate-700/30 backdrop-blur-sm bg-slate-900/50">
            <div className="flex items-center h-full">
              {/* Mobile: แสดงเต็มเสมอ, Desktop: ตาม isCollapsed */}
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center space-x-3 group",
                  isCollapsed && "lg:space-x-0 lg:justify-center lg:w-full"
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-white to-slate-100 rounded-xl flex items-center justify-center shadow-xl p-1 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                    <img
                      src={ASSETS.LOGO}
                      alt="POSE Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-slate-900 animate-pulse shadow-lg shadow-green-500/50"></div>
                </div>
                <div
                  className={cn("flex flex-col", isCollapsed && "lg:hidden")}
                >
                  <span className="text-lg font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent tracking-tight">
                    POSE
                  </span>
                  <span className="text-[10px] text-slate-400 -mt-0.5 font-medium tracking-wide">
                    Intelligence
                  </span>
                </div>
              </Link>
            </div>

            {/* Close/Collapse Button - ด้านขวานอก Sidebar */}
            {/* Mobile: ปุ่มปิด, Desktop: ปุ่มหุบ/ขยาย */}
            <button
              onClick={() =>
                isMobileOpen
                  ? setIsMobileOpen(false)
                  : setIsCollapsed(!isCollapsed)
              }
              className={cn(
                "flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 group",
                "w-7 h-7 rounded-full items-center justify-center",
                "bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-xl shadow-blue-500/30",
                "text-white hover:scale-125 hover:rotate-180 active:scale-95 transition-all duration-300",
                "border-2 border-slate-800 hover:border-slate-700",
                // Mobile: แสดงเฉพาะเมื่อ sidebar เปิด, Desktop: แสดงเสมอ
                isMobileOpen ? "lg:flex" : "hidden lg:flex"
              )}
            >
              {/* Mobile: แสดง X, Desktop: แสดง ChevronLeft/Right */}
              <span className="lg:hidden drop-shadow-lg">
                <X className="h-4 w-4" />
              </span>
              <span className="hidden lg:block drop-shadow-lg group-hover:scale-110 transition-transform">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600/60 scrollbar-track-slate-900/30 hover:scrollbar-thumb-slate-500/80 scrollbar-thumb-rounded-full">
            {/* Main Menu Items */}
            <div className="space-y-2">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isSubmenuOpen = openSubmenus[item.href];

                return (
                  <div key={item.href}>
                    <button
                      onClick={() => {
                        if (hasSubmenu) {
                          toggleSubmenu(item.href);
                        } else {
                          window.location.href = item.href;
                          setIsMobileOpen(false);
                        }
                      }}
                      className={cn(
                        "group relative flex items-center w-full px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-300 overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-blue-500/90 via-blue-600/90 to-purple-600/90 text-white shadow-xl shadow-blue-500/20 border border-blue-400/20"
                          : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/60 hover:to-slate-700/40 hover:text-white hover:shadow-lg hover:shadow-slate-900/50 border border-transparent hover:border-slate-600/30",
                        "space-x-3",
                        isCollapsed && "lg:justify-center lg:space-x-0"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {/* Animated background on active */}
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 animate-pulse"></div>
                          <div
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-white/80 via-blue-200 to-white/80 rounded-r-full shadow-lg shadow-white/20",
                              isCollapsed && "lg:hidden"
                            )}
                          ></div>
                        </>
                      )}

                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-all duration-300 relative z-10",
                          isActive 
                            ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-110" 
                            : "group-hover:scale-110 group-hover:rotate-3"
                        )}
                      />

                      <div
                        className={cn(
                          "flex-1 min-w-0 text-left relative z-10",
                          isCollapsed && "lg:hidden"
                        )}
                      >
                        <p className={cn(
                          "font-semibold truncate transition-all",
                          isActive && "drop-shadow-sm"
                        )}>{item.name}</p>
                        {!isActive && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 group-hover:text-slate-300 transition-colors">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Dropdown Icon สำหรับ submenu */}
                      {hasSubmenu && !isCollapsed && (
                        <div className="flex-shrink-0 relative z-10">
                          {isSubmenuOpen ? (
                            <ChevronUp className={cn(
                              "h-4 w-4 transition-transform",
                              isActive && "drop-shadow-sm"
                            )} />
                          ) : (
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform group-hover:translate-y-0.5",
                              isActive && "drop-shadow-sm"
                            )} />
                          )}
                        </div>
                      )}

                      {/* Shine effect on hover */}
                      {!isActive && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                      )}
                    </button>

                    {/* Submenu - แสดงเมื่อเปิด */}
                    {hasSubmenu && !isCollapsed && isSubmenuOpen && (
                      <div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-3 duration-300 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-slate-600/50 before:to-transparent">
                        {item.submenu.map((subItem: any) => {
                          const isSubActive = pathname === subItem.href;
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                "group relative block px-3 py-2.5 text-xs rounded-lg transition-all duration-300 overflow-hidden",
                                isSubActive
                                  ? "bg-gradient-to-r from-slate-700/90 to-slate-700/70 text-white font-semibold shadow-md border border-slate-600/30"
                                  : "text-slate-400 hover:bg-slate-700/40 hover:text-white border border-transparent hover:border-slate-600/20"
                              )}
                            >
                              {/* Active indicator */}
                              {isSubActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 via-blue-500 to-purple-500 rounded-r-full shadow-lg shadow-blue-500/30"></div>
                              )}
                              
                              <div className="flex items-center gap-2.5 relative z-10">
                                {SubIcon ? (
                                  <SubIcon
                                    className={cn(
                                      "h-4 w-4 flex-shrink-0 transition-all duration-300",
                                      isSubActive
                                        ? "text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.5)]"
                                        : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                                    )}
                                  />
                                ) : (
                                  <div
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                      isSubActive
                                        ? "bg-blue-400 shadow-lg shadow-blue-400/50"
                                        : "bg-slate-600 group-hover:bg-slate-400"
                                    )}
                                  ></div>
                                )}
                                <span className={cn(
                                  "transition-colors",
                                  isSubActive && "drop-shadow-sm"
                                )}>{subItem.name}</span>
                              </div>

                              {/* Shine effect */}
                              {!isSubActive && (
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div
              className={cn(
                "relative my-5",
                isCollapsed && "lg:my-3"
              )}
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent"></div>
              </div>
              <div className={cn(
                "relative flex justify-center",
                isCollapsed && "lg:hidden"
              )}>
              </div>
            </div>

            {/* Management Section */}
            <div className="space-y-2 pt-1">
              {managementMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isSubmenuOpen = openSubmenus[item.href];

                return (
                  <div key={item.href}>
                    <button
                      onClick={() => {
                        if (hasSubmenu) {
                          toggleSubmenu(item.href);
                        } else {
                          window.location.href = item.href;
                          setIsMobileOpen(false);
                        }
                      }}
                      className={cn(
                        "group relative flex items-center w-full px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-300 overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-blue-500/90 via-blue-600/90 to-purple-600/90 text-white shadow-xl shadow-blue-500/20 border border-blue-400/20"
                          : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/60 hover:to-slate-700/40 hover:text-white hover:shadow-lg hover:shadow-slate-900/50 border border-transparent hover:border-slate-600/30",
                        "space-x-3",
                        isCollapsed && "lg:justify-center lg:space-x-0"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {/* Animated background on active */}
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 animate-pulse"></div>
                          <div
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-white/80 via-blue-200 to-white/80 rounded-r-full shadow-lg shadow-white/20",
                              isCollapsed && "lg:hidden"
                            )}
                          ></div>
                        </>
                      )}

                      <Icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-all duration-300 relative z-10",
                          isActive 
                            ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-110" 
                            : "group-hover:scale-110 group-hover:rotate-3"
                        )}
                      />

                      <div
                        className={cn(
                          "flex-1 min-w-0 text-left relative z-10",
                          isCollapsed && "lg:hidden"
                        )}
                      >
                        <p className={cn(
                          "font-semibold truncate transition-all",
                          isActive && "drop-shadow-sm"
                        )}>{item.name}</p>
                        {!isActive && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 group-hover:text-slate-300 transition-colors">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Dropdown Icon สำหรับ submenu */}
                      {hasSubmenu && !isCollapsed && (
                        <div className="flex-shrink-0 relative z-10">
                          {isSubmenuOpen ? (
                            <ChevronUp className={cn(
                              "h-4 w-4 transition-transform",
                              isActive && "drop-shadow-sm"
                            )} />
                          ) : (
                            <ChevronDown className={cn(
                              "h-4 w-4 transition-transform group-hover:translate-y-0.5",
                              isActive && "drop-shadow-sm"
                            )} />
                          )}
                        </div>
                      )}

                      {/* Shine effect on hover */}
                      {!isActive && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>
                      )}
                    </button>

                    {/* Submenu - แสดงเมื่อเปิด */}
                    {hasSubmenu && !isCollapsed && isSubmenuOpen && (
                      <div className="mt-2 ml-6 space-y-1 animate-in slide-in-from-top-3 duration-300 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-slate-600/50 before:to-transparent">
                        {item.submenu.map((subItem: any) => {
                          const isSubActive = pathname === subItem.href;
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                "group relative block px-3 py-2.5 text-xs rounded-lg transition-all duration-300 overflow-hidden",
                                isSubActive
                                  ? "bg-gradient-to-r from-slate-700/90 to-slate-700/70 text-white font-semibold shadow-md border border-slate-600/30"
                                  : "text-slate-400 hover:bg-slate-700/40 hover:text-white border border-transparent hover:border-slate-600/20"
                              )}
                            >
                              {/* Active indicator */}
                              {isSubActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 via-blue-500 to-purple-500 rounded-r-full shadow-lg shadow-blue-500/30"></div>
                              )}
                              
                              <div className="flex items-center gap-2.5 relative z-10">
                                {SubIcon ? (
                                  <SubIcon
                                    className={cn(
                                      "h-4 w-4 flex-shrink-0 transition-all duration-300",
                                      isSubActive
                                        ? "text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.5)]"
                                        : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                                    )}
                                  />
                                ) : (
                                  <div
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                      isSubActive
                                        ? "bg-blue-400 shadow-lg shadow-blue-400/50"
                                        : "bg-slate-600 group-hover:bg-slate-400"
                                    )}
                                  ></div>
                                )}
                                <span className={cn(
                                  "transition-colors",
                                  isSubActive && "drop-shadow-sm"
                                )}>{subItem.name}</span>
                              </div>

                              {/* Shine effect */}
                              {!isSubActive && (
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div
            className={cn(
              "p-4 border-t border-slate-700/30 backdrop-blur-sm bg-slate-900/50",
              isCollapsed && "lg:px-2"
            )}
          >
            {/* Mobile: แสดงเต็ม, Desktop: ตาม isCollapsed */}
            <div
              className={cn(
                "relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-xl p-3.5 border border-blue-500/20 overflow-hidden group",
                isCollapsed && "lg:hidden"
              )}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex items-center space-x-2.5 mb-2 relative z-10">
                <div className="w-6 h-6 bg-gradient-to-br from-white to-slate-100 rounded-lg flex items-center justify-center p-0.5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={ASSETS.LOGO}
                    alt="POSE Logo"
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  POSE Intelligence
                </p>
              </div>
              <p className="text-[10px] text-slate-400 relative z-10 font-medium">
                © 2026 All rights reserved
              </p>
              
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
            </div>

            {/* Desktop เมื่อหุบ: แสดงแค่ logo */}
            <div
              className={cn("hidden justify-center group", isCollapsed && "lg:flex")}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-white to-slate-100 rounded-xl flex items-center justify-center p-1 shadow-xl group-hover:shadow-blue-500/30 group-hover:scale-110 transition-all duration-300">
                <img
                  src={ASSETS.LOGO}
                  alt="POSE Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
