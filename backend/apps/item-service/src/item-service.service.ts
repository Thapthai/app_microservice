import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateItemDto, UpdateItemDto, GetItemsQuery } from './item-service.controller';

@Injectable()
export class ItemServiceService {
  constructor(private prisma: PrismaService) {}

  async createItem(createItemDto: CreateItemDto) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: createItemDto.userId },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const item = await this.prisma.item.create({
        data: {
          name: createItemDto.name,
          description: createItemDto.description,
          price: createItemDto.price,
          quantity: createItemDto.quantity || 0,
          category: createItemDto.category,
          userId: createItemDto.userId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
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

  async findAllItems(query: GetItemsQuery = {}) {
    try {
      const where: any = {};

      if (query.userId) where.userId = query.userId;
      if (query.category) where.category = query.category;
      if (query.isActive !== undefined) where.isActive = query.isActive;

      const items = await this.prisma.item.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: items,
        count: items.length,
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
          user: {
            select: { id: true, name: true, email: true },
          },
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
          user: {
            select: { id: true, name: true, email: true },
          },
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

  async findItemsByUser(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const items = await this.prisma.item.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
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
