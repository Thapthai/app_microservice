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
    Link as LinkIcon,
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
                name: 'จัดการตู้ Cabinet',
                href: '/staff/cabinets',
                icon: Package,
                description: 'จัดการตู้ Cabinet',
            },
            {
                name: 'จัดการตู้ Cabinet - แผนก',
                href: '/staff/cabinet-departments',
                icon: LinkIcon,
                description: 'จัดการตู้ Cabinet และเชื่อมโยงกับแผนก',
            },
            {
                name: 'สต๊อกอุปกรณ์ในตู้',
                href: '/staff/items',
                description: 'เมนูสต๊อกอุปกรณ์ที่มีในตู้ SmartCabinet',
                icon: Package,
            },
            {
                name: 'บันทึกใช้อุปกรณ์กับคนไข้',
                href: '/staff/medical-supplies/usage-record',
                description: 'บันทึกใช้อุปกรณ์กับคนไข้ จากตู้ SmartCabinet',
                icon: History,
            },
            {
                name: 'รายงานเบิกอุปกรณ์จากตู้',
                href: '/staff/medical-supplies/dispense-from-cabinet',
                description: 'รายงานการเบิกอุปกรณ์จากตู้ SmartCabinet',
                icon: FileBarChart,
            },
            {
                name: 'รายงานคืนอุปกรณ์เข้าตู้',
                href: '/staff/medical-supplies/return-to-cabinet-report',
                description: 'รายงานการคืนอุปกรณ์เข้าตู้ SmartCabinet',
                icon: FileBarChart,
            },
            {
                name: 'เปรียบเทียบตามเวชภัณฑ์',
                href: '/staff/medical-supplies/item-comparison',
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
                name: 'รายงานทั้งหมด',
                href: '/staff/medical-supplies/reports',
                description: 'รายงานทางการแพทย์ทั้งหมด',
                icon: FileBarChart,
            },
            {
                name: 'เปรียบเทียบตามผู้ป่วย',
                href: '/staff/medical-supplies/comparison',
                description: 'เปรียบเทียบการเบิกกับการใช้งานตามผู้ป่วย',
                icon: FileBarChart,
            },
            {
                name: 'การใช้อุปกรณ์',
                href: '/staff/medical-supplies/equipment-usage',
                description: 'รายงานการใช้อุปกรณ์กับคนไข้',
                icon: ClipboardList,
            },
            {
                name: 'การตัดจ่าย',
                href: '/staff/medical-supplies/equipment-disbursement',
                description: 'รายงานการรับบันทึกตัดจ่ายอุปกรณ์',
                icon: FileText,
            },
            {
                name: 'รายงาน Vending',
                href: '/staff/medical-supplies/vending-reports',
                description: 'รายงานการ Mapping และการเบิกอุปกรณ์จาก Vending',
                icon: TrendingUp,
            },
            {
                name: 'รายงานยกเลิก Bill',
                href: '/staff/medical-supplies/cancel-bill-report',
                description: 'รายงานการยกเลิก Bill และใบเสร็จ',
                icon: TrendingUp,
            },
            {
                name: 'คืนเวชภัณฑ์',
                href: '/staff/medical-supplies/reports/return-report',
                description: 'รายงานการคืนเวชภัณฑ์',
                icon: TrendingUp,
            },
        ],
    },
    {
        name: 'ตั้งค่า',
        href: '/staff/settings',
        icon: Settings,
        description: 'ตั้งค่าระบบ',
    },
    {
        name: 'จัดการสิทธิ์',
        href: '/staff/permissions/users',
        icon: Users,
        description: 'จัดการ User',
        roles: ['it1'],
    },
    {
        name: 'กำหนดสิทธิ์',
        href: '/staff/permissions/roles',
        icon: Shield,
        description: 'กำหนดสิทธิ์การเข้าถึงเมนู',
        roles: ['it1'],
    },

];
