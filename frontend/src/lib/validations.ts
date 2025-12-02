import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('กรุณาใส่อีเมลที่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().email('กรุณาใส่อีเมลที่ถูกต้อง'),
  password: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/[a-z]/, 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[A-Z]/, 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[^a-zA-Z0-9]/, 'รหัสผ่านต้องมีอักษรพิเศษอย่างน้อย 1 ตัว'),
});

export const itemSchema = z.object({
  name: z.string().min(2, 'ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร'),
  description: z.string().optional(),
  category_id: z.number({ message: 'กรุณาเลือกหมวดหมู่' }).min(1, 'กรุณาเลือกหมวดหมู่'),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร').max(100, 'ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร'),
  description: z.string().max(500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร').optional(),
  slug: z.string().optional(),
  is_active: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ItemFormData = z.infer<typeof itemSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
