'use client';

import { useState, useEffect } from 'react';
import { staffUserApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

interface StaffUser {
  id: number;
  email: string;
  fname: string;
  lname: string;
  role: string;
  client_id: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ManageUsersPage() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    fname: '',
    lname: '',
    role: '',
    password: 'password123',
    expires_at: '',
  });

  const [editRoleData, setEditRoleData] = useState({
    role: '',
  });

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search query
    if (!searchQuery.trim()) {
      setFilteredUsers(staffUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = staffUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.fname.toLowerCase().includes(query) ||
          user.lname.toLowerCase().includes(query) ||
          getRoleLabel(user.role).toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, staffUsers]);

  const fetchStaffUsers = async () => {
    try {
      setLoading(true);
      const response = await staffUserApi.getAllStaffUsers();
      if (response.success) {
        setStaffUsers(response.data || []);
        setFilteredUsers(response.data || []);
      } else {
        toast.error(response.message || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error: any) {
      toast.error(error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await staffUserApi.createStaffUser(formData);
      if (response.success) {
        toast.success('สร้าง User เรียบร้อยแล้ว');
        setIsCreateDialogOpen(false);
        setFormData({ email: '', fname: '', lname: '', role: '', password: 'password123', expires_at: '' });
        fetchStaffUsers();
      } else {
        toast.error(response.message || 'ไม่สามารถสร้าง User ได้');
      }
    } catch (error: any) {
      toast.error(error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  };

  const handleEditRole = (user: StaffUser) => {
    setSelectedStaff(user);
    setEditRoleData({ role: user.role });
    setIsEditRoleDialogOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      const response = await staffUserApi.updateStaffUser(selectedStaff.id, {
        role: editRoleData.role,
      });
      if (response.success) {
        toast.success('แก้ไขสิทธิ์เรียบร้อยแล้ว');
        setIsEditRoleDialogOpen(false);
        setSelectedStaff(null);
        fetchStaffUsers();
      } else {
        toast.error(response.message || 'ไม่สามารถแก้ไขสิทธิ์ได้');
      }
    } catch (error: any) {
      toast.error(error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ User นี้?')) {
      return;
    }

    try {
      const response = await staffUserApi.deleteStaffUser(id);
      if (response.success) {
        toast.success('ลบ User เรียบร้อยแล้ว');
        fetchStaffUsers();
      } else {
        toast.error(response.message || 'ไม่สามารถลบ User ได้');
      }
    } catch (error: any) {
      toast.error(error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      it1: 'IT 1',
      it2: 'IT 2',
      it3: 'IT 3',
      warehouse1: 'Warehouse 1',
      warehouse2: 'Warehouse 2',
      warehouse3: 'Warehouse 3',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role.startsWith('it')) {
      return 'default';
    } else if (role.startsWith('warehouse')) {
      return 'secondary';
    }
    return 'outline';
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">จัดการ User</h2>
        <p className="text-gray-600 mt-1">จัดการข้อมูลผู้ใช้งานในระบบ</p>
      </div>

      {/* Search and Add */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการ User</CardTitle>
              <CardDescription>ค้นหาและจัดการข้อมูลผู้ใช้งาน</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่ม User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>เพิ่ม User ใหม่</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="create-email">อีเมล *</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-fname">ชื่อจริง *</Label>
                    <Input
                      id="create-fname"
                      value={formData.fname}
                      onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-lname">นามสกุล *</Label>
                    <Input
                      id="create-lname"
                      value={formData.lname}
                      onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-role">บทบาท (Role) *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="เลือกบทบาท" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it1">IT 1</SelectItem>
                        <SelectItem value="it2">IT 2</SelectItem>
                        <SelectItem value="it3">IT 3</SelectItem>
                        <SelectItem value="warehouse1">Warehouse 1</SelectItem>
                        <SelectItem value="warehouse2">Warehouse 2</SelectItem>
                        <SelectItem value="warehouse3">Warehouse 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-password">รหัสผ่าน (ค่าเริ่มต้น: password123)</Label>
                    <Input
                      id="create-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit">สร้าง</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหา User (อีเมล, ชื่อ, บทบาท)..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูล User'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">
                      {user.fname} {user.lname}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditRole(user)}
                          title="แก้ไขสิทธิ์"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขสิทธิ์</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <Label>ผู้ใช้</Label>
                <Input
                  value={`${selectedStaff.fname} ${selectedStaff.lname} (${selectedStaff.email})`}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">บทบาท (Role) *</Label>
                <Select
                  value={editRoleData.role}
                  onValueChange={(value) => setEditRoleData({ role: value })}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it1">IT 1</SelectItem>
                    <SelectItem value="it2">IT 2</SelectItem>
                    <SelectItem value="it3">IT 3</SelectItem>
                    <SelectItem value="warehouse1">Warehouse 1</SelectItem>
                    <SelectItem value="warehouse2">Warehouse 2</SelectItem>
                    <SelectItem value="warehouse3">Warehouse 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit">บันทึก</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการใช้งาน</CardTitle>
          <CardDescription>หน้านี้สำหรับจัดการข้อมูลผู้ใช้งานในระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              • สามารถเพิ่ม, แก้ไขสิทธิ์ (Role), และลบ User ได้
            </p>
            <p className="text-sm text-gray-600">
              • สามารถกำหนดบทบาท (Role) ให้กับ User ได้: IT 1, IT 2, IT 3, Warehouse 1, Warehouse 2, Warehouse 3
            </p>
            <p className="text-sm text-gray-600">
              • สามารถค้นหา User ด้วยอีเมล, ชื่อ, หรือบทบาท
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

