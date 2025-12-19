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

  // JSON endpoint (no file)
  @Post()
  async create(@Body() body: any) {


    return this.itemServiceService.createItem(body);
  }

  // Multipart endpoint (with file)
  @Post('upload')
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
  async createWithFile(
    @UploadedFile() file: any,
    @Body() body: any,
  ) {


    // Add file path if file uploaded
    if (file) {
      body.Picture = `uploads/items/${file.filename}`;
    }

    return this.itemServiceService.createItem(body);
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

  @Get(':itemcode')
  async findOne(@Param('itemcode') itemcode: string) {
    return this.itemServiceService.findOneItem(itemcode);
  }

  @Put(':itemcode')
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
    @Param('itemcode') itemcode: string,
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
      itemname: cleanBody.itemname,
      Barcode: cleanBody.Barcode,
      CostPrice: cleanBody.CostPrice ? parseFloat(cleanBody.CostPrice) : undefined,
      SalePrice: cleanBody.SalePrice ? parseFloat(cleanBody.SalePrice) : undefined,
      stock_balance: cleanBody.stock_balance ? parseInt(cleanBody.stock_balance) : undefined,
      DepartmentID: cleanBody.DepartmentID ? parseInt(cleanBody.DepartmentID) : undefined,
      item_status: cleanBody.item_status !== undefined ? parseInt(cleanBody.item_status) : undefined,
    };

    if (file) {
      updateItemDto.Picture = `uploads/items/${file.filename}`;
    }

    return this.itemServiceService.updateItem(itemcode, updateItemDto);
  }

  @Delete(':itemcode')
  async remove(@Param('itemcode') itemcode: string) {
    return this.itemServiceService.removeItem(itemcode);
  }
}

