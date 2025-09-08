import { Controller, DefaultValuePipe, ParseIntPipe, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ItemServiceService } from './item-service.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';


@Controller()
export class ItemServiceController {
  constructor(private readonly itemServiceService: ItemServiceService) { }

  @MessagePattern('item.create')
  async createItem(@Payload() createItemDto: CreateItemDto) {
    return this.itemServiceService.createItem(createItemDto);
    // return "createItem";
  }

  @MessagePattern('item.findAll')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
  ) {
    return this.itemServiceService.findAllItems(page, limit, keyword);
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
