import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateItemMinMaxDto } from './dto/update-item-minmax.dto';

@Injectable()
export class ItemServiceService {
  constructor(private prisma: PrismaService) { }

  async createItem(createItemDto: CreateItemDto) {
    try {
     

      // Remove undefined/null values from the DTO
      const cleanData = Object.fromEntries(
        Object.entries(createItemDto).filter(([_, value]) => value !== undefined && value !== null)
      ) as any;

 

      // Add timestamp if not provided
      if (!cleanData.CreateDate) {
        cleanData.CreateDate = new Date();
      }
      if (!cleanData.ModiflyDate) {
        cleanData.ModiflyDate = new Date();
      }
 

      const item = await this.prisma.item.create({
        data: cleanData,
      });

      return {
        success: true,
        message: 'Item created successfully',
        data: item,
      };
    } catch (error) {
      console.error('❌ Create error:', error.message);
      return { success: false, message: 'Failed to create item', error: error.message };
    }
  }

  async findAllItems(page: number, limit: number, keyword?: string, sort_by: string = 'itemcode', sort_order: string = 'asc') {
    try {
      const where: any = {};
      const skip = (page - 1) * limit;
      if (keyword) {
        where.OR = [
          { itemname: { contains: keyword } },
          { itemcode: { contains: keyword } },
          { itemcode2: { contains: keyword } },
          { itemcode3: { contains: keyword } },
          { Barcode: { contains: keyword } },
        ];
      }

      // Build orderBy object - Prisma needs proper type
      const validSortFields = ['itemcode', 'itemname', 'CostPrice', 'SalePrice', 'CreateDate'];
      const validSortOrders = ['asc', 'desc'];

      const field = validSortFields.includes(sort_by) ? sort_by : 'itemcode';
      const order = validSortOrders.includes(sort_order) ? sort_order as 'asc' | 'desc' : 'desc' as 'asc' | 'desc';

      const orderBy: any = {};
      orderBy[field] = order;

      // Calculate total value of active items (item_status = 0 means active)
      const activeItems = await this.prisma.item.findMany({
        where: { item_status: 0 },
        select: {
          CostPrice: true,
          stock_balance: true,
        },
      });

      const totalValue = activeItems.reduce((sum, item) => {
        const price = item.CostPrice ? Number(item.CostPrice) : 0;
        const quantity = item.stock_balance ?? 0;
        return sum + (price * quantity);
      }, 0);

      const [data, total, activeItemsCount] = await Promise.all([
        this.prisma.item.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.item.count({ where }),
        this.prisma.item.count({ where: { item_status: 0 } }),
      ]);

      // Debug: ตรวจสอบข้อมูล Min/Max
      if (data.length > 0) {
        console.log('🔍 First item Min/Max:', {
          itemcode: data[0].itemcode,
          Minimum: data[0].Minimum,
          Maximum: data[0].Maximum,
        });
      }

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

  async findOneItem(itemcode: string) {
    try {
      const item = await this.prisma.item.findUnique({
        where: { itemcode },
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

  async updateItem(itemcode: string, updateItemDto: UpdateItemDto) {
    try {
      const existingItem = await this.prisma.item.findUnique({
        where: { itemcode },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      // Remove undefined/null values from the DTO
      const cleanData = Object.fromEntries(
        Object.entries(updateItemDto).filter(([_, value]) => value !== undefined && value !== null)
      ) as any;

      const item = await this.prisma.item.update({
        where: { itemcode },
        data: cleanData,
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

  async removeItem(itemcode: string) {
    try {
      const existingItem = await this.prisma.item.findUnique({
        where: { itemcode },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      await this.prisma.item.delete({
        where: { itemcode },
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
        where: { item_status: 0 },
        orderBy: { CreateDate: 'desc' },
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

  async updateItemMinMax(itemcode: string, updateMinMaxDto: UpdateItemMinMaxDto) {
    try {
      // Check if item exists
      const existingItem = await this.prisma.item.findUnique({
        where: { itemcode },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      // Validate: Maximum should be >= Minimum
      if (updateMinMaxDto.Maximum !== undefined && updateMinMaxDto.Minimum !== undefined) {
        if (updateMinMaxDto.Maximum < updateMinMaxDto.Minimum) {
          return { 
            success: false, 
            message: 'Maximum must be greater than or equal to Minimum' 
          };
        }
      }

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateMinMaxDto).filter(([_, value]) => value !== undefined)
      ) as any;

      // Add ModiflyDate
      cleanData.ModiflyDate = new Date();

      const updatedItem = await this.prisma.item.update({
        where: { itemcode },
        data: cleanData,
      });

      return {
        success: true,
        message: 'Item min/max updated successfully',
        data: updatedItem,
      };
    } catch (error) {
      console.error('❌ Update min/max error:', error.message);
      return { 
        success: false, 
        message: 'Failed to update item min/max', 
        error: error.message 
      };
    }
  }
}
