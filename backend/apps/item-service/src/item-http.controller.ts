import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, DefaultValuePipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ItemServiceService } from './item-service.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Controller('items')
export class ItemHttpController {
  constructor(private readonly itemServiceService: ItemServiceService) { }

  @Post()
  @UseInterceptors(FileInterceptor('picture', {
    storage: diskStorage({
      destination: process.env.UPLOAD_PATH || './uploads/items',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async create(
    @UploadedFile() file: any,
    @Body() body: any,
  ) {


    // ทำความสะอาด keys ที่มี tab character
    const cleanBody: any = {};
    Object.keys(body).forEach(key => {
      const cleanKey = key.replace(/\t/g, '').trim();
      cleanBody[cleanKey] = body[key];
    });

    const createItemDto: CreateItemDto = {
      name: cleanBody.name,
      description: cleanBody.description,
      price: parseFloat(cleanBody.price),
      quantity: parseInt(cleanBody.quantity),
      category_id: cleanBody.category_id ? parseInt(cleanBody.category_id) : undefined,
      is_active: cleanBody.is_active === 'true' || cleanBody.is_active === true,
      number: cleanBody.number ? parseInt(cleanBody.number) : undefined,
      item_code: cleanBody.item_code,
      uom: cleanBody.uom,
      size: cleanBody.size,
      department: cleanBody.department,
    };

    if (file) {
      createItemDto.picture_path = `uploads/items/${file.filename}`;
    }

    return this.itemServiceService.createItem(createItemDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_order') sort_order?: string,
  ) {
    return this.itemServiceService.findAllItems(page, limit, keyword, sort_by, sort_order);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemServiceService.findOneItem(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('picture', {
    storage: diskStorage({
      destination: process.env.UPLOAD_PATH || './uploads/items',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
    @Body() body: any,
  ) {
    // ทำความสะอาด keys ที่มี tab character
    const cleanBody: any = {};
    Object.keys(body).forEach(key => {
      const cleanKey = key.replace(/\t/g, '').trim();
      cleanBody[cleanKey] = body[key];
    });

    const updateItemDto: UpdateItemDto = {
      name: cleanBody.name,
      description: cleanBody.description,
      price: cleanBody.price ? parseFloat(cleanBody.price) : undefined,
      quantity: cleanBody.quantity ? parseInt(cleanBody.quantity) : undefined,
      category_id: cleanBody.category_id ? parseInt(cleanBody.category_id) : undefined,
      is_active: cleanBody.is_active !== undefined ? (cleanBody.is_active === 'true' || cleanBody.is_active === true) : undefined,
      number: cleanBody.number ? parseInt(cleanBody.number) : undefined,
      item_code: cleanBody.item_code,
      uom: cleanBody.uom,
      size: cleanBody.size,
      department: cleanBody.department,
    };

    if (file) {
      updateItemDto.picture_path = `uploads/items/${file.filename}`;
    }

    return this.itemServiceService.updateItem(id, updateItemDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemServiceService.removeItem(id);
  }
}

