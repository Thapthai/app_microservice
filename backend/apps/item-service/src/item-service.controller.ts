import { Controller, DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ItemServiceService } from './item-service.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateItemMinMaxDto } from './dto/update-item-minmax.dto';


@Controller()
export class ItemServiceController {
  constructor(private readonly itemServiceService: ItemServiceService) { }

  @MessagePattern('item.create')
  async createItem(@Payload() createItemDto: CreateItemDto) {
    return this.itemServiceService.createItem(createItemDto);
    // return "createItem";
  }

  @MessagePattern('item.findAll')
  findAll(@Payload() query: {
    page: number;
    limit: number;
    keyword?: string;
    sort_by?: string;
    sort_order?: string;
    cabinet_id?: number;
    department_id?: number;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const keyword = query.keyword;
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';
    const cabinet_id = query.cabinet_id;
    const department_id = query.department_id;
    const status = query.status;
    return this.itemServiceService.findAllItems
      (page,
        limit,
        keyword,
        sortBy,
        sortOrder,
        cabinet_id,
        department_id,
        status);
  }


  @MessagePattern('item.findOne')
  async findOneItem(@Payload() itemcode: string) {
    return this.itemServiceService.findOneItem(itemcode);
  }

  @MessagePattern('item.update')
  async updateItem(@Payload() data: { itemcode: string; updateItemDto: UpdateItemDto }) {
    return this.itemServiceService.updateItem(data.itemcode, data.updateItemDto);
  }

  @MessagePattern('item.remove')
  async removeItem(@Payload() itemcode: string) {
    return this.itemServiceService.removeItem(itemcode);
  }

  @MessagePattern('item.findByUser')
  async findItemsByUser(@Payload() user_id: number) {
    return this.itemServiceService.findItemsByUser(user_id);
  }

  @MessagePattern('item.updateMinMax')
  async updateItemMinMax(@Payload() data: { itemcode: string; updateMinMaxDto: UpdateItemMinMaxDto }) {
    return this.itemServiceService.updateItemMinMax(data.itemcode, data.updateMinMaxDto);
  }

  @MessagePattern('item.getStats')
  async getItemsStats(@Payload() query: { cabinet_id?: number; department_id?: number }) {
    return this.itemServiceService.getItemsStats(query.cabinet_id, query.department_id);
  }

  @MessagePattern('itemStock.findAll')
  findAllItemStock(@Payload() query: { page?: number; limit?: number; keyword?: string; sort_by?: string; sort_order?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const keyword = query.keyword;
    const sortBy = query.sort_by || 'ItemCode';
    const sortOrder = query.sort_order || 'asc';
    return this.itemServiceService.findAllItemStock(page, limit, keyword, sortBy, sortOrder);
  }

  @MessagePattern('itemStock.findAllInCabinet')
  findAllItemStockInCabinet(@Payload() query: { page?: number; limit?: number; keyword?: string; sort_by?: string; sort_order?: string; cabinet_id?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const keyword = query.keyword;
    const cabinet_id = query.cabinet_id;
    return this.itemServiceService.findAllItemStockInCabinet(page, limit, keyword, cabinet_id);
  }

  @MessagePattern('itemStock.findAllWillReturn')
  findAllItemStockWillReturn() {
    return this.itemServiceService.findAllItemStockWillReturn();
  }
}
