import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateItemMinMaxDto } from './dto/update-item-minmax.dto';

@Injectable()
export class ItemServiceService {
  constructor(private prisma: PrismaService) {}

  async createItem(createItemDto: CreateItemDto) {
    try {
      // Remove undefined/null values from the DTO
      const cleanData = Object.fromEntries(
        Object.entries(createItemDto).filter(
          ([_, value]) => value !== undefined && value !== null,
        ),
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
      return {
        success: false,
        message: 'Failed to create item',
        error: error.message,
      };
    }
  }

  async findAllItems(
    page: number,
    limit: number,
    keyword?: string,
    sort_by: string = 'itemcode',
    sort_order: string = 'asc',
  ) {
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
      const validSortFields = [
        'itemcode',
        'itemname',
        'CostPrice',
        'SalePrice',
        'CreateDate',
      ];
      const validSortOrders = ['asc', 'desc'];

      const field = validSortFields.includes(sort_by) ? sort_by : 'itemcode';
      const order = validSortOrders.includes(sort_order)
        ? (sort_order as 'asc' | 'desc')
        : ('desc' as 'asc' | 'desc');

      const orderBy: any = {};
      orderBy[field] = order;

      // Get all items matching the filter criteria (including keyword search)
      const allItemsQuery = await this.prisma.item.findMany({
        where: {
          ...where,
          item_status: 0, // Only active items
        },
        include: {
          itemStocks: {
            where: {
              StockID: 1,
              RfidCode: {
                not: '',
              },
            },
            select: {
              Qty: true,
            },
          },
        },
      });

      // Calculate stock_balance for each item and map to required fields
      const itemsWithStockBalance = allItemsQuery.map((item) => {
        const stockBalance = item.itemStocks.reduce((sum, s) => sum + (s.Qty ?? 0), 0);
        return {
          itemcode: item.itemcode,
          itemname: item.itemname,
          CostPrice: item.CostPrice,
          SalePrice: item.SalePrice,
          CreateDate: item.CreateDate,
          stock_max: item.stock_max,
          stock_min: item.stock_min,
          item_status: item.item_status,
          stock_balance: stockBalance,
        };
      });

      // Calculate low stock items (stock_balance < stock_min)
      const lowStockItems = itemsWithStockBalance.filter((item) => {
        const stockBalance = item.stock_balance ?? 0;
        const minimum = item.stock_min ?? 0;
        return minimum > 0 && stockBalance < minimum;
      });

      // Sort: items with stock (stock_balance > 0) first, then items with 0 stock
      // Within each group, maintain the original order (by itemcode)
      itemsWithStockBalance.sort((a, b) => {
        const stockA = a.stock_balance ?? 0;
        const stockB = b.stock_balance ?? 0;
        
        // If both are 0 or both are > 0, maintain original order
        if ((stockA === 0 && stockB === 0) || (stockA > 0 && stockB > 0)) {
          return 0;
        }
        
        // Items with stock > 0 come first
        if (stockA > 0 && stockB === 0) {
          return -1;
        }
        
        // Items with stock = 0 come last
        return 1;
      });

      // Apply pagination after sorting
      const total = itemsWithStockBalance.length;
      const startIndex = skip;
      const endIndex = skip + limit;
      const data = itemsWithStockBalance.slice(startIndex, endIndex);

      const [activeItemsCount] = await Promise.all([
        this.prisma.item.count({ where: { item_status: 0 } }),
      ]);

      return {
        data: data,
        total,
        page,
        lastPage: Math.ceil(total / limit),
        stats: {
          low_stock_items: lowStockItems.length,
          total_items: total,
          active_items: activeItemsCount,
          inactive_items: total - activeItemsCount,
           
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch items',
        error: error.message,
      };
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
      return {
        success: false,
        message: 'Failed to fetch item',
        error: error.message,
      };
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
        Object.entries(updateItemDto).filter(
          ([_, value]) => value !== undefined && value !== null,
        ),
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
      return {
        success: false,
        message: 'Failed to update item',
        error: error.message,
      };
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
      return {
        success: false,
        message: 'Failed to delete item',
        error: error.message,
      };
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
      return {
        success: false,
        message: 'Failed to fetch user items',
        error: error.message,
      };
    }
  }

  async updateItemMinMax(
    itemcode: string,
    updateMinMaxDto: UpdateItemMinMaxDto,
  ) {
    try {
      // Check if item exists
      const existingItem = await this.prisma.item.findUnique({
        where: { itemcode },
      });

      if (!existingItem) {
        return { success: false, message: 'Item not found' };
      }

      // Validate: stock_max should be >= stock_min
      if (
        updateMinMaxDto.stock_max !== undefined &&
        updateMinMaxDto.stock_min !== undefined
      ) {
        if (updateMinMaxDto.stock_max < updateMinMaxDto.stock_min) {
          return {
            success: false,
            message: 'Stock Max must be greater than or equal to Stock Min',
          };
        }
      }

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateMinMaxDto).filter(
          ([_, value]) => value !== undefined,
        ),
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
        error: error.message,
      };
    }
  }
}
