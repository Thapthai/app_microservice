// Type definitions for menu and submenu
export interface StaffMenuSubItem {
    name: string;
    href: string;
    description?: string;
    icon?: any;
}

export interface StaffMenuItem {
    name: string;
    href: string;
    icon?: any;
    description?: string;
    submenu?: StaffMenuSubItem[];
    roles?: string[];
}
// Utility to filter menu and submenu by permissions
export function filterMenuByPermissions(
    menuItems: StaffMenuItem[],
    permissions: Record<string, boolean>
): StaffMenuItem[] {
    return menuItems
        .filter((item) => permissions[item.href] !== false)
        .map((item) => {
            if (item.submenu) {
                const filteredSubmenu = item.submenu.filter((sub) => permissions[sub.href] !== false);
                return { ...item, submenu: filteredSubmenu };
            }
            return item;
        })
        .filter((item) => !item.submenu || item.submenu.length > 0);
}
import {
    LayoutDashboard,
    Box,
    Package,
    History,
    FileBarChart,
    BarChart3,
    ClipboardList,
    FileText,
    TrendingUp,
    Settings,
    Users,
    Shield,
    Network,
} from 'lucide-react';

export const staffMenuItems = [
    {
        name: 'Dashboard',
        href: '/staff/dashboard',
        icon: LayoutDashboard,
        description: 'ภาพรวมระบบ',
    },
    {
        name: 'อุปกรณ์',
        href: '/equipment',
        icon: Box,
        description: 'จัดการอุปกรณ์และสต๊อก',
        submenu: [

            {
                name: 'จัดการตู้ Cabinet - แผนก',
                href: '/staff/cabinet-departments',
                icon: Network,
                description: 'จัดการตู้ Cabinet และเชื่อมโยงกับแผนก',
            },
            {
                name: 'สต๊อกอุปกรณ์ในตู้',
                href: '/staff/items',
                description: 'เมนูสต๊อกอุปกรณ์ที่มีในตู้ SmartCabinet',
                icon: Package,
            },
            {
                name: 'รายงานเบิกอุปกรณ์จากตู้',
                href: '/staff/dispense-from-cabinet',
                description: 'รายงานการเบิกอุปกรณ์จากตู้ SmartCabinet',
                icon: FileBarChart,
            },
            {
                name: 'บันทึกใช้อุปกรณ์กับคนไข้',
                href: '/staff/usage-record',
                description: 'บันทึกใช้อุปกรณ์กับคนไข้ จากตู้ SmartCabinet',
                icon: History,
            },
            {
                name: 'รายงานเติมอุปกรณ์จากตู้',
                href: '/staff/return-to-cabinet-report',
                description: 'รายงานการเติมอุปกรณ์จากตู้ SmartCabinet',
                icon: FileBarChart,
            },
            {
                name: 'เปรียบเทียบตามเวชภัณฑ์',
                href: '/staff/item-comparison',
                description: 'เปรียบเทียบการเบิกกับการใช้งานตามเวชภัณฑ์',
                icon: FileBarChart,
            },
        ],
    },
    {
        name: 'รายงาน',
        href: '/reports',
        icon: BarChart3,
        description: 'รายงานและสถิติต่างๆ',
        submenu: [
            {
                name: 'รายงาน Vending',
                href: '/staff/reports/vending-reports',
                description: 'รายงานการ Mapping และการเบิกอุปกรณ์จาก Vending',
                icon: TrendingUp,
            },
            {
                name: 'รายงานยกเลิก Bill',
                href: '/staff/reports/cancel-bill-report',
                description: 'รายงานการยกเลิก Bill และใบเสร็จ',
                icon: TrendingUp,
            },
            {
                name: 'คืนเวชภัณฑ์',
                href: '/staff/reports/return-report',
                description: 'รายงานการคืนเวชภัณฑ์',
                icon: TrendingUp,
            },
        ],
    },

    {
        name: 'ตั้งค่า',
        href: '/management',
        icon: Settings,
        description: 'ตั้งค่าระบบ',
        submenu: [
            {
                name: 'จัดการตู้ Cabinet',
                href: '/staff/management/cabinets',
                icon: Package,
                description: 'จัดการตู้ Cabinet',
            },
            {
                name: 'จัดการสิทธิ์',
                href: '/staff/management/permission-users',
                icon: Users,
                description: 'จัดการ User',
                roles: ['it1'],
            },
            {
                name: 'กำหนดสิทธิ์',
                href: '/staff/management/permission-roles',
                icon: Shield,
                description: 'กำหนดสิทธิ์การเข้าถึงเมนู',
                roles: ['it1'],
            },
        ],
    },


];
