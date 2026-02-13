'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { staffRolePermissionApi } from '@/lib/api';
import {
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { staffMenuItems, filterMenuByPermissions } from '@/app/staff/menus';
import { Button } from '@/components/ui/button';

interface StaffSidebarProps {
  staffUser?: {
    fname?: string;
    lname?: string;
    name?: string;
    email: string;
    role?: string | { code?: string; name?: string };
  };
  onLogout?: () => void;
  isAdmin?: boolean;
}


export default function StaffSidebar({ staffUser, onLogout, isAdmin = false }: StaffSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  // Next.js automatically strips basePath from pathname, so we can use it directly
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Load permissions for current user's role
  useEffect(() => {
    if (isAdmin) {
      // Admin has access to all menus
      const allPermissions: Record<string, boolean> = {};
      staffMenuItems.forEach((item) => {
        allPermissions[item.href] = true;
        if (item.submenu) {
          item.submenu.forEach((subItem) => {
            allPermissions[subItem.href] = true;
          });
        }
      });
      setPermissions(allPermissions);
    } else if (staffUser?.role) {
      loadPermissions();
    }
  }, [staffUser?.role, isAdmin]);

  const loadPermissions = async () => {
    if (!staffUser?.role || isAdmin) return;

    try {
      const roleCode = typeof staffUser.role === 'string' ? staffUser.role : staffUser.role?.code;
      if (!roleCode) return;

      const response = await staffRolePermissionApi.getByRole(roleCode);
      if (response.success && response.data) {
        const permissionsMap: Record<string, boolean> = {};
        (response.data as Array<{ menu_href: string; can_access: boolean }>).forEach((perm) => {
          permissionsMap[perm.menu_href] = perm.can_access;
        });
        setPermissions(permissionsMap);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      // Fallback to default behavior if API fails
    }
  };

  const isPathActive = (path: string, href: string) =>
    path === href || path.startsWith(href + '/');

  const getRoleLabel = (role?: string | { code?: string; name?: string }) => {
    if (isAdmin) return 'Admin';

    const roleCode = typeof role === 'string' ? role : role?.code || '';
    const roleMap: Record<string, string> = {
      it1: 'IT 1',
      it2: 'IT 2',
      it3: 'IT 3',
      warehouse1: 'Warehouse 1',
      warehouse2: 'Warehouse 2',
      warehouse3: 'Warehouse 3',
    };
    return roleMap[roleCode] || roleCode || 'Staff';
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-lg hover:bg-gray-50 border-gray-200 h-9 w-9"
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 ease-in-out shadow-2xl',
          isCollapsed ? 'w-16 lg:w-16' : 'w-72 lg:w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            {!isCollapsed && (
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold truncate">Staff Portal</h2>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
                <LayoutDashboard className="h-6 w-6" />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex text-slate-300 hover:text-white hover:bg-slate-700/50 flex-shrink-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User Avatar when collapsed */}
          {staffUser && isCollapsed && (
            <div className="px-2 py-4 border-b border-slate-700/50 flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-slate-700/50">
                {isAdmin
                  ? (staffUser.name?.charAt(0) || staffUser.email?.charAt(0) || 'A').toUpperCase()
                  : (staffUser.fname?.charAt(0) || 'S').toUpperCase()
                }
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50 hover:scrollbar-thumb-slate-500">
            {/* Admin - Back to Admin Panel Link */}
            {isAdmin && (
              <Link
                href="/admin/items"
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'group relative flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 mb-4',
                  'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:from-amber-600 hover:to-orange-700',
                  isCollapsed && 'lg:justify-center lg:px-2'
                )}
                title={isCollapsed ? 'กลับไปหน้า Admin' : undefined}
              >
                <Shield className={cn('h-5 w-5 flex-shrink-0', isCollapsed ? 'lg:mx-auto' : 'mr-3')} />
                {!isCollapsed && (
                  <span className="flex-1 font-semibold">กลับไปหน้า Admin</span>
                )}
              </Link>
            )}

            {filterMenuByPermissions(staffMenuItems, permissions)
              .map((item) => {
                const Icon = item.icon;
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isActive =
                  isPathActive(pathname, item.href) ||
                  (hasSubmenu && item.submenu!.some((s) => isPathActive(pathname, s.href)));
                const open = openSubmenus[item.href] ?? isActive;

                return (
                  <div key={item.href}>
                    <div
                      className={cn(
                        'group relative flex items-center w-full rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                        isCollapsed && 'lg:justify-center lg:px-2'
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
                            'flex flex-1 min-w-0 items-center px-3 py-3 text-sm font-medium rounded-xl text-inherit text-left cursor-pointer',
                            isActive && 'text-white',
                            isCollapsed && 'lg:justify-center lg:px-2'
                          )}
                          title={isCollapsed ? item.name : undefined}
                        >
                          {isActive && !isCollapsed && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                          )}
                          <Icon className={cn('h-5 w-5 flex-shrink-0', isCollapsed ? 'lg:mx-auto' : 'mr-3')} />
                          {!isCollapsed && <span className="flex-1 truncate text-left">{item.name}</span>}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            'flex flex-1 min-w-0 items-center px-3 py-3 text-sm font-medium rounded-xl text-inherit',
                            isActive && 'text-white',
                            isCollapsed && 'lg:justify-center lg:px-2'
                          )}
                          title={isCollapsed ? item.name : undefined}
                        >
                          {isActive && !isCollapsed && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                          )}
                          <Icon className={cn('h-5 w-5 flex-shrink-0', isCollapsed ? 'lg:mx-auto' : 'mr-3')} />
                          {!isCollapsed && <span className="flex-1 truncate text-left">{item.name}</span>}
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
                            'flex-shrink-0 p-2 rounded-lg text-inherit hover:bg-white/10 transition-colors',
                            isActive && 'text-white'
                          )}
                          aria-expanded={open}
                          aria-label={open ? 'ปิดเมนูย่อย' : 'เปิดเมนูย่อย'}
                        >
                          <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-90')} />
                        </button>
                      )}
                    </div>

                    {/* Submenu */}
                    {hasSubmenu && open && !isCollapsed && (
                      <div className="ml-4 mt-2 space-y-1 border-l-2 border-slate-700/50 pl-4">
                        {item.submenu!.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = isPathActive(pathname, subItem.href);
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={cn(
                                'flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200',
                                isSubActive
                                  ? 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-500'
                                  : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
                              )}
                            >
                              {SubIcon ? <SubIcon className="h-4 w-4 mr-2 flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" />}
                              <span>{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
            {onLogout && (
              <Button
                variant="ghost"
                onClick={() => {
                  onLogout();
                  setIsMobileOpen(false);
                }}
                className={cn(
                  'w-full justify-start text-slate-300 hover:text-white hover:bg-red-500/20',
                  isCollapsed && 'lg:justify-center lg:px-2'
                )}
                title={isCollapsed ? 'ออกจากระบบ' : undefined}
              >
                <LogOut className={cn('h-5 w-5', isCollapsed ? 'lg:mx-auto' : 'mr-3')} />
                {!isCollapsed && <span>ออกจากระบบ</span>}
              </Button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
