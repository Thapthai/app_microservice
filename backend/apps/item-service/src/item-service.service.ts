import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemServiceService {
  constructor(private prisma: PrismaService) { }

  async createItem(createItemDto: CreateItemDto) {
    try {

      const item = await this.prisma.item.create({
        data: {
          name: createItemDto.name,
          description: createItemDto.description,
          price: createItemDto.price,
          quantity: createItemDto.quantity ?? 0,
          category_id: createItemDto.category_id ?? null,
          is_active: createItemDto.is_active ?? true,
        },
        include: {
          category: true,
        },
      });

      return {
        success: true,
        message: 'Item created successfully',
        data: item,
      };
    } catch (error) {
      return { success: false, message: 'Failed to create item', error: error.message };
    }
  }

  async findAllItems(page: number, limit: number, keyword?: string, sort_by: string = 'created_at', sort_order: string = 'desc') {
    try {

      const where: any = {};
      const skip = (page - 1) * limit;
      if (keyword) {
        where.OR = [
          { name: { contains: keyword } },
        ];
      }

      // Build orderBy object - Prisma needs proper type
      const validSortFields = ['name', 'price', 'quantity', 'created_at'];
      const validSortOrders = ['asc', 'desc'];
      
      const field = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const order = validSortOrders.includes(sort_order) ? sort_order as 'asc' | 'desc' : 'desc' as 'asc' | 'desc';
      
      // Debug log
      console.log('🔍 Sort params:', { sort_by, sort_order, field, order });
      
      const orderBy: any = {};
      orderBy[field] = order;

      // Calculate total value of active items
      const activeItems = await this.prisma.item.findMany({
        where: { is_active: true },
        select: {
          price: true,
          quantity: true,
        },
      });

      const totalValue = activeItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      const [data, total, activeItemsCount] = await Promise.all([
        this.prisma.item.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: true,
          },
        }),
        this.prisma.item.count({ where }),
        this.prisma.item.count({ where: { is_active: true } }),
      ]);

      return {
        data,
        total,
        page,
        lastPage: Math.ceil(total / limit),
        stats: {
          total_value: totalValue,
          total_items: total,
          active_items: activeItemsCount,
          inactive_items: total - activeItemsCount,
        },
      };
    } catch (error) {
      return { success: false, message: 'Failed to fetch items', error: error.message };
    }
  }

  async findOneItem(id: number) {
    try {
      const item = await this.prisma.item.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      if (!item) {
        return { success: false, message: 'Item not found' };
      }

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return { success: false, message: 'Failed to fetch item', error: error.message };
    }
  }

  async updateItem(id: number, updateItemDto: UpdateItemDto) {
    try {
      const existingItem = await this.prisma.item.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      const item = await this.prisma.item.update({
        where: { id },
        data: updateItemDto,
        include: {
          category: true,
        },
      });

      return {
        success: true,
        message: 'Item updated successfully',
        data: item,
      };
    } catch (error) {
      return { success: false, message: 'Failed to update item', error: error.message };
    }
  }

  async removeItem(id: number) {
    try {
      const existingItem = await this.prisma.item.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      await this.prisma.item.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Item deleted successfully',
      };
    } catch (error) {
      return { success: false, message: 'Failed to delete item', error: error.message };
    }
  }

  async findItemsByUser(user_id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const items = await this.prisma.item.findMany({
        where: {},
        orderBy: { created_at: 'desc' },
      });

      return {
        success: true,
        data: items,
        count: items.length,
      };
    } catch (error) {
      return { success: false, message: 'Failed to fetch user items', error: error.message };
    }
  }
}
