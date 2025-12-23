'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ASSETS } from '@/lib/assets';
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
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const mainMenuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'ภาพรวมระบบ',
  },
  {
    name: 'เวชภัณฑ์',
    href: '/medical-supplies',
    icon: Syringe,
    description: 'จัดการเวชภัณฑ์',
    submenu: [
      {
        name: 'รายการเบิก',
        href: '/medical-supplies',
        description: 'จัดการรายการเบิกเวชภัณฑ์',
      },
      {
        name: 'รายงานทั้งหมด',
        href: '/medical-supplies/reports',
        description: 'รายงานทางการแพทย์ทั้งหมด',
        icon: FileBarChart,
      },
      {
        name: 'รายเปรียบเทียบตามผู้ป่วย',
        href: '/medical-supplies/comparison',
        description: 'เปรียบเทียบการเบิกกับการใช้งานตามผู้ป่วย',
        icon: FileBarChart,
      },
      {
        name: 'รายเปรียบเทียบตามเวชภัณฑ์',
        href: '/medical-supplies/item-comparison',
        description: 'เปรียบเทียบการเบิกกับการใช้งานตามเวชภัณฑ์',
        icon: FileBarChart,
      },
      {
        name: 'รายงานการใช้อุปกรณ์',
        href: '/medical-supplies/equipment-usage',
        description: 'รายงานการใช้อุปกรณ์กับคนไข้',
        icon: ClipboardList,
      },
      {
        name: 'รายงานการตัดจ่าย',
        href: '/medical-supplies/equipment-disbursement',
        description: 'รายงานการรับบันทึกตัดจ่ายอุปกรณ์',
        icon: FileText,
      },
    ],
  },
];

const managementMenuItems = [
  {
    name: 'Category',
    href: '/admin/categories',
    icon: Tag,
    description: 'จัดการหมวดหมู่',
  },
  {
    name: 'สินค้า',
    href: '/admin/items',
    icon: Package,
    description: 'รายการเวชภัณฑ์ทั้งหมด',
  },
  {
    name: 'Staff Users',
    href: '/admin/staff-users',
    icon: Users,
    description: 'จัดการ Staff Users และ Client Credentials',
  },
  {
    name: 'โปรไฟล์',
    href: '/profile',
    icon: User,
    description: 'ข้อมูลส่วนตัว',
  },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [openSubmenus, setOpenSubmenus] = React.useState<{ [key: string]: boolean }>({
    '/medical-supplies': true, // เปิด submenu เวชภัณฑ์ by default
  });

  const toggleSubmenu = (href: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  return (
    <>
      {/* Mobile Menu Button - แสดงเฉพาะเมื่อ sidebar ปิด */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen transition-all duration-300',
          'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900',
          'border-r border-slate-700/50 shadow-2xl',
          // Mobile: เสมอ w-64, Desktop: ขึ้นกับ isCollapsed
          'w-64 lg:w-64',
          isCollapsed && 'lg:w-16',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="relative h-16 px-4 border-b border-slate-700/50">
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
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1">
                    <img
                      src={ASSETS.LOGO}
                      alt="POSE Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
                </div>
                <div className={cn(
                  "flex flex-col",
                  isCollapsed && "lg:hidden"
                )}>
                  <span className="text-lg font-bold text-white tracking-tight">POSE</span>
                  <span className="text-[10px] text-slate-400 -mt-1">Intelligence</span>
                </div>
              </Link>
            </div>
            
            {/* Close/Collapse Button - ด้านขวานอก Sidebar */}
            {/* Mobile: ปุ่มปิด, Desktop: ปุ่มหุบ/ขยาย */}
            <button
              onClick={() => isMobileOpen ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed)}
              className={cn(
                "flex absolute -right-3 top-1/2 -translate-y-1/2 z-50",
                "w-6 h-6 rounded-full items-center justify-center",
                "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg",
                "text-white hover:scale-110 transition-all duration-200",
                "border-2 border-slate-800",
                // Mobile: แสดงเฉพาะเมื่อ sidebar เปิด, Desktop: แสดงเสมอ
                isMobileOpen ? "lg:flex" : "hidden lg:flex"
              )}
            >
              {/* Mobile: แสดง X, Desktop: แสดง ChevronLeft/Right */}
              <span className="lg:hidden">
                <X className="h-3.5 w-3.5" />
              </span>
              <span className="hidden lg:block">
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5" />
                )}
              </span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50 hover:scrollbar-thumb-slate-500">
            {/* Main Menu Items */}
            <div className="space-y-2">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
                        'group relative flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                        'space-x-3',
                        isCollapsed && 'lg:justify-center lg:space-x-0'
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {isActive && (
                        <div className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full",
                          isCollapsed && "lg:hidden"
                        )}></div>
                      )}
                      
                      <Icon className={cn(
                        'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                        isActive && 'drop-shadow-lg'
                      )} />
                    
                      <div className={cn(
                        "flex-1 min-w-0 text-left",
                        isCollapsed && "lg:hidden"
                      )}>
                        <p className="font-medium truncate">{item.name}</p>
                        {!isActive && (
                          <p className="text-xs text-slate-400 truncate">{item.description}</p>
                        )}
                      </div>

                      {/* Dropdown Icon สำหรับ submenu */}
                      {hasSubmenu && !isCollapsed && (
                        <div className="flex-shrink-0">
                          {isSubmenuOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 transition-all"></div>
                      )}
                    </button>
                    
                    {/* Submenu - แสดงเมื่อเปิด */}
                    {hasSubmenu && !isCollapsed && isSubmenuOpen && (
                      <div className="mt-1 ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.submenu.map((subItem: any) => {
                          const isSubActive = pathname === subItem.href;
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                'block px-3 py-2 text-xs rounded-lg transition-all duration-200',
                                isSubActive
                                  ? 'bg-slate-700/70 text-white font-semibold'
                                  : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {SubIcon ? (
                                  <SubIcon className={cn(
                                    "h-3.5 w-3.5 flex-shrink-0",
                                    isSubActive ? "text-blue-400" : "text-slate-500"
                                  )} />
                                ) : (
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isSubActive ? "bg-blue-400" : "bg-slate-600"
                                  )}></div>
                                )}
                                {subItem.name}
                              </div>
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
            <div className={cn(
              "border-t border-slate-700/50 my-4",
              isCollapsed && "lg:my-2"
            )}></div>

            {/* Management Section */}
            <div className="space-y-2">
              {/* Section Header */}
              <div className={cn(
                "px-3 mb-2",
                isCollapsed && "lg:hidden"
              )}>
                <p className="text-xs font-medium text-slate-500 lowercase">
                  จัดการ
                </p>
              </div>

              {managementMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'group relative flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                      'space-x-3',
                      isCollapsed && 'lg:justify-center lg:space-x-0'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {isActive && (
                      <div className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full",
                        isCollapsed && "lg:hidden"
                      )}></div>
                    )}
                    
                    <Icon className={cn(
                      'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                      isActive && 'drop-shadow-lg'
                    )} />
                    
                    <div className={cn(
                      "flex-1 min-w-0",
                      isCollapsed && "lg:hidden"
                    )}>
                      <p className="font-medium truncate">{item.name}</p>
                      {!isActive && (
                        <p className="text-xs text-slate-400 truncate">{item.description}</p>
                      )}
                    </div>
                    
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/5 group-hover:to-purple-600/5 transition-all"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className={cn(
            "p-4 border-t border-slate-700/50",
            isCollapsed && "lg:px-2"
          )}>
            {/* Mobile: แสดงเต็ม, Desktop: ตาม isCollapsed */}
            <div className={cn(
              "bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl p-3 border border-blue-500/20",
              isCollapsed && "lg:hidden"
            )}>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-white rounded flex items-center justify-center p-0.5">
                  <img
                    src={ASSETS.LOGO}
                    alt="POSE Logo"
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs font-semibold text-white">POSE Intelligence</p>
              </div>
              <p className="text-[10px] text-slate-400">
                © 2025 All rights reserved
              </p>
            </div>
            
            {/* Desktop เมื่อหุบ: แสดงแค่ logo */}
            <div className={cn(
              "hidden justify-center",
              isCollapsed && "lg:flex"
            )}>
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-0.5">
                <img
                  src={ASSETS.LOGO}
                  alt="POSE Logo"
                  width={20}
                  height={20}
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
