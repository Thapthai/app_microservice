import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryServiceService } from './category-service.service';

@Controller()
export class CategoryServiceController {
  constructor(private readonly categoryServiceService: CategoryServiceService) { }

  @MessagePattern('category.create')
  create(@Payload() createCategoryDto: CreateCategoryDto) {
    return this.categoryServiceService.create(createCategoryDto);
  }

  @MessagePattern('category.findAll')
  findAll(@Payload() data: { page?: number; limit?: number; parentId?: string }) {
    return this.categoryServiceService.findAll(data);
  }

  @MessagePattern('category.findOne')
  findOne(@Payload() id: string) {
    return this.categoryServiceService.findOne(id);
  }

  @MessagePattern('category.findBySlug')
  findBySlug(@Payload() slug: string) {
    return this.categoryServiceService.findBySlug(slug);
  }

  @MessagePattern('category.update')
  update(@Payload() data: { id: string; updateCategoryDto: UpdateCategoryDto }) {
    return this.categoryServiceService.update(data.id, data.updateCategoryDto);
  }

  @MessagePattern('category.remove')
  remove(@Payload() id: string) {
    return this.categoryServiceService.remove(id);
  }

  @MessagePattern('category.getTree')
  getTree() {
    return this.categoryServiceService.getCategoryTree();
  }

  @MessagePattern('category.getChildren')
  getChildren(@Payload() parentId: string) {
    return this.categoryServiceService.getChildren(parentId);
  }
}
