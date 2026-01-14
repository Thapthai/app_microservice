'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, FileText } from 'lucide-react';

export default function StaffDashboardPage() {
  const [staffUser, setStaffUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('staff_user');
    if (user) {
      setStaffUser(JSON.parse(user));
    }
  }, []);

  if (!staffUser) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            ยินดีต้อนรับ, {staffUser.fname}!
          </h2>
          <p className="text-gray-600">อีเมล: {staffUser.email}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                รายการเบิก
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                ยังไม่มีข้อมูล
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                รายการใช้งาน
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                ยังไม่มีข้อมูล
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                รายงาน
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                ยังไม่มีข้อมูล
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการใช้งาน</CardTitle>
            <CardDescription>
              ระบบสำหรับพนักงาน - สามารถดูและจัดการข้อมูลพื้นฐาน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Client ID:</strong> {staffUser.client_id}
              </p>
              <p className="text-sm text-gray-600">
                <strong>สถานะ:</strong>{' '}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ใช้งานอยู่
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

      {/* Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          📌 <strong>หมายเหตุ:</strong> หน้านี้เป็น Dashboard สำหรับ Staff 
          สามารถเพิ่มเมนูและฟีเจอร์ต่างๆ ได้ตามต้องการ
        </p>
      </div>
    </>
  );
}

