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
  findAll(@Payload() query: { page: number; limit: number; keyword?: string; sort_by?: string; sort_order?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const keyword = query.keyword;
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';
    return this.itemServiceService.findAllItems(page, limit, keyword, sortBy, sortOrder);
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
}
