import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryServiceService {
  constructor(private prisma: PrismaService) { }

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      // Generate slug if not provided
      if (!createCategoryDto.slug) {
        createCategoryDto.slug = createCategoryDto.name;
      }

      // Check if slug already exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug: createCategoryDto.slug }
      });

      if (existingCategory) {
        throw new BadRequestException('Category with this slug already exists');
      }


      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
          slug: createCategoryDto.slug,
          image: createCategoryDto.image,
          is_active: createCategoryDto.is_active ?? true,

        }
      });

      return {
        success: true,
        data: category,
        message: 'Category created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(params: { page?: number; limit?: number; parentId?: string }) {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    try {
      const where = {};

      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          skip,
          take: limit,

          orderBy: { created_at: 'desc' }
        }),
        this.prisma.category.count({ where })
      ]);

      return {
        success: true,
        data: categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: parseInt(id) }
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return {
        success: true,
        data: category
      };
    } catch (error) {
      throw error;
    }
  }

  async findBySlug(slug: string) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug },

      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return {
        success: true,
        data: category
      };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      // Check if category exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingCategory) {
        throw new NotFoundException('Category not found');
      }

      // Generate slug if name is being updated and slug is not provided
      if (updateCategoryDto.name && !updateCategoryDto.slug) {
        updateCategoryDto.slug = updateCategoryDto.name;
      }

      // Check if new slug already exists (excluding current category)
      if (updateCategoryDto.slug && updateCategoryDto.slug !== existingCategory.slug) {
        const slugExists = await this.prisma.category.findFirst({
          where: {
            slug: updateCategoryDto.slug,
            id: { not: parseInt(id) } // Exclude current category
          }
        });

        if (slugExists) {
          throw new BadRequestException('Category with this slug already exists');
        }
      }



      // Prepare update data with proper field mapping
      const updateData: any = { ...updateCategoryDto };
   

      const category = await this.prisma.category.update({
        where: { id: parseInt(id) },
        data: updateData,

      });

      return {
        success: true,
        data: category,
        message: 'Category updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Check if category exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existingCategory) {
        throw new NotFoundException('Category not found');
      }

      // Note: Item model no longer has category_id relation
      // Check if category has items (products) using it - DISABLED
      // const itemsCount = await this.prisma.item.count({
      //   where: { /* no category_id field */ }
      // });

      // if (itemsCount > 0) {
      //   throw new BadRequestException(
      //     `Cannot delete category. There are ${itemsCount} item(s) using this category. Please remove or reassign items first.`
      //   );
      // }

      // Delete category
      await this.prisma.category.delete({
        where: { id: parseInt(id) }
      });

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getCategoryTree() {
    try {
      const categories = await this.prisma.category.findMany({
        where: {},

        orderBy: { created_at: 'desc' }
      });

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      throw error;
    }
  }

  async getChildren(parentId: string) {
    try {
      const children = await this.prisma.category.findMany({
        orderBy: { created_at: 'desc' }
      });

      return {
        success: true,
        data: children
      };
    } catch (error) {
      throw error;
    }
  }


}
