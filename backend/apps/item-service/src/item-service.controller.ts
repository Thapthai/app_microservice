import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ItemServiceService } from './item-service.service';

export interface CreateItemDto {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  category?: string;
  userId: number;
}

export interface UpdateItemDto {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
  isActive?: boolean;
}

export interface GetItemsQuery {
  userId?: number;
  category?: string;
  isActive?: boolean;
}

@Controller()
export class ItemServiceController {
  constructor(private readonly itemServiceService: ItemServiceService) {}

  @MessagePattern('item.create')
  async createItem(@Payload() createItemDto: CreateItemDto) {
    return this.itemServiceService.createItem(createItemDto);
  }

  @MessagePattern('item.findAll')
  async findAllItems(@Payload() query: GetItemsQuery) {
    return this.itemServiceService.findAllItems(query);
  }

  @MessagePattern('item.findOne')
  async findOneItem(@Payload() id: number) {
    return this.itemServiceService.findOneItem(id);
  }

  @MessagePattern('item.update')
  async updateItem(@Payload() data: { id: number; updateItemDto: UpdateItemDto }) {
    return this.itemServiceService.updateItem(data.id, data.updateItemDto);
  }

  @MessagePattern('item.remove')
  async removeItem(@Payload() id: number) {
    return this.itemServiceService.removeItem(id);
  }

  @MessagePattern('item.findByUser')
  async findItemsByUser(@Payload() userId: number) {
    return this.itemServiceService.findItemsByUser(userId);
  }
}
