import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('กรุณาใส่อีเมลที่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().email('กรุณาใส่อีเมลที่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

export const itemSchema = z.object({
  name: z.string().min(2, 'ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร'),
  description: z.string().optional(),
  price: z.number().min(0, 'ราคาต้องมากกว่าหรือเท่ากับ 0'),
  quantity: z.number().min(0, 'จำนวนต้องมากกว่าหรือเท่ากับ 0').optional(),
  category: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ItemFormData = z.infer<typeof itemSchema>;
