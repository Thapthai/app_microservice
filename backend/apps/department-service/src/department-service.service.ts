import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateCabinetDepartmentDto, UpdateCabinetDepartmentDto } from './dto/department.dto';
import { CreateCabinetDto, UpdateCabinetDto } from './dto/cabinet.dto';

@Injectable()
export class DepartmentServiceService {
  private readonly logger = new Logger(DepartmentServiceService.name);

  constructor(private prisma: PrismaService) { }


  async getAllDepartments(query?: { page?: number; limit?: number; keyword?: string }) {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;


      const where: any = {};

      if (query?.keyword) {
        where.OR = [
          { DepName: { contains: query.keyword } },
          { DepName2: { contains: query.keyword } },
          // { DepNameimed: { contains: query.keyword } },
        ];
      }



      const [departments, total] = await Promise.all([
        this.prisma.department.findMany({
          where,
          skip,
          take: limit,
          orderBy: { sort: 'asc' },
        }),
        this.prisma.department.count({ where }),
      ]);


      return {
        success: true,
        data: departments,
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error fetching departments: ${error.message}`);
      return {
        success: false,
        message: 'Failed to fetch departments',
        error: error.message,
      };
    }
  }



  // =========================== Cabinet CRUD operations ===========================
  /** ค่าเริ่มต้นชื่อย่อ รพ. สำหรับรหัสตู้ */
  private readonly HOSPITAL_PREFIX = 'VTN';

  /**
   * สร้าง cabinet_code จาก stock_id ที่รับมา (หรือสร้าง stock_id อัตโนมัติถ้าไม่ส่งมา)
   * รูปแบบ: VTN-ER-001 (ชื่อย่อรพ.-RefDepID ของแผนก-เลข stock_id 3 หลัก)
   * ถ้าไม่เลือกแผนก: VTN-001
   */
  private async generateCabinetCode(options: {
    hospitalPrefix?: string;
    department_id?: number;
    stock_id?: number;
  }): Promise<{ cabinet_code: string; stock_id: number }> {
    const prefix = options.hospitalPrefix ?? this.HOSPITAL_PREFIX;
    let refDepId = '';

    if (options.department_id) {
      const dept = await this.prisma.department.findUnique({
        where: { ID: options.department_id },
        select: { RefDepID: true },
      });
      if (dept?.RefDepID?.trim()) {
        refDepId = dept.RefDepID.trim().toUpperCase();
      }
    }

    let stock_id: number;
    if (options.stock_id != null && options.stock_id > 0) {
      stock_id = options.stock_id;
    } else {
      const maxStock = await this.prisma.cabinet.findFirst({
        where: { stock_id: { not: null } },
        select: { stock_id: true },
        orderBy: { stock_id: 'desc' },
      });
      stock_id = (maxStock?.stock_id ?? 0) + 1;
    }

    const segment = refDepId ? `${prefix}-${refDepId}` : prefix;
    const cabinet_code = `${segment}-${String(stock_id).padStart(3, '0')}`;

    return { cabinet_code, stock_id };
  }

  async createCabinet(data: CreateCabinetDto) {
    try {
      const { department_id, ...rest } = data;
      let cabinet_code = data.cabinet_code?.trim();
      let stock_id = data.stock_id;

      if (!cabinet_code || stock_id == null) {
        const generated = await this.generateCabinetCode({
          hospitalPrefix: this.HOSPITAL_PREFIX,
          department_id,
          stock_id: stock_id ?? undefined,
        });
        if (!cabinet_code) cabinet_code = generated.cabinet_code;
        if (stock_id == null) stock_id = generated.stock_id;
      }

      const cabinet = await this.prisma.cabinet.create({
        data: {
          ...rest,
          cabinet_code,
          stock_id,
          // เลือกแผนกแล้วให้สถานะตู้เป็น USED
          ...(department_id ? { cabinet_status: 'USED' } : {}),
        },
      });

      // ถ้าเลือกแผนก ให้สร้าง cabinetDepartment ในคราวเดียว (ผูกตู้กับแผนก)
      if (department_id) {
        const department = await this.prisma.department.findUnique({
          where: { ID: department_id },
        });
        if (department) {
          await this.prisma.cabinetDepartment.create({
            data: {
              cabinet_id: cabinet.id,
              department_id,
              status: 'ACTIVE',
            },
          });
        }
      }

      // ดึง cabinet พร้อม cabinetDepartments สำหรับ response
      const cabinetWithDepts = await this.prisma.cabinet.findUnique({
        where: { id: cabinet.id },
        include: {
          cabinetDepartments: {
            select: { id: true, department_id: true, status: true },
          },
        },
      });

      return {
        success: true,
        message: 'Cabinet created successfully',
        data: cabinetWithDepts ?? cabinet,
      };
    } catch (error) {
      this.logger.error(`Error creating cabinet: ${error.message}`);
      return {
        success: false,
        message: 'Failed to create cabinet',
        error: error.message,
      };
    }
  }

  async getAllCabinets(query?: { page?: number; limit?: number; keyword?: string }) {
    try {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query?.keyword) {
        where.OR = [
          { cabinet_name: { contains: query.keyword } },
          { cabinet_code: { contains: query.keyword } },
        ];
      }

      const [cabinets, total] = await Promise.all([
        this.prisma.cabinet.findMany({
          where,
          skip,
          take: limit,
          include: {
            cabinetDepartments: {
              select: {
                id: true,
                department_id: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.cabinet.count({ where }),
      ]);

      return {
        success: true,
        data: cabinets,
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error fetching cabinets: ${error.message}`);
      return {
        success: false,
        message: 'Failed to fetch cabinets',
        error: error.message,
      };
    }
  }

  async getCabinetById(id: number) {
    try {
      const cabinet = await this.prisma.cabinet.findUnique({
        where: { id: id },
      });

      return {
        success: true,
        data: cabinet,
      };
    } catch (error) {
      this.logger.error(`Error fetching cabinet: ${error.message}`);
      return {
        success: false,
        message: 'Failed to fetch cabinet',
        error: error.message,
      };
    }
  }

  async updateCabinet(id: number, data: UpdateCabinetDto) {
    try {
      const cabinet = await this.prisma.cabinet.update({
        where: { id: id },
        data,
      });

      return {
        success: true,
        message: 'Cabinet updated successfully',
        data: cabinet,
      };
    } catch (error) {
      this.logger.error(`Error updating cabinet: ${error.message}`);
      return {
        success: false,
        message: 'Failed to update cabinet',
        error: error.message,
      };
    }
  }
  async deleteCabinet(id: number) {
    try {
      await this.prisma.cabinet.delete({
        where: { id: id },
      });

      return {
        success: true,
        message: 'Cabinet deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Error deleting cabinet: ${error.message}`);
      return {
        success: false,
        message: 'Failed to delete cabinet',
        error: error.message,
      };
    }
  }

  // =========================== Cabinet-Department CRUD operations ===========================
  async createCabinetDepartment(data: CreateCabinetDepartmentDto) {
    try {

      const cabinet = await this.prisma.cabinet.findUnique({
        where: {
          id: data.cabinet_id,
        },
      });

      const department = await this.prisma.department.findUnique({
        where: {
          ID: data.department_id,
        },
      });

      // If not found, return info without throwing error
      if (!cabinet || !department) {
        return {
          success: false,
          message: 'Validation failed - data not found'
        };
      }

      // Check if the mapping already exists
      const existingCabinetUsed = await this.prisma.cabinetDepartment.findFirst({
        where: {
          cabinet_id: data.cabinet_id,
        },
      });

      if (existingCabinetUsed) {
        return {
          success: false,
          message: 'Cabinet already used'
        };
      }

      // Both found, create mapping
      const mapping = await this.prisma.cabinetDepartment.create({
        data: {
          cabinet_id: data.cabinet_id,
          department_id: data.department_id,
          status: data.status || 'ACTIVE',
          description: data.description,
        }
      });

      // Change cabinet status to USED
      await this.prisma.cabinet.update({
        where: { id: data.cabinet_id },
        data: { cabinet_status: 'USED' },
      });

      return {
        success: true,
        message: 'Cabinet-Department mapping created successfully',
        data: {
          mapping,
          cabinet,
          department,
        }
      };
    } catch (error) {
      this.logger.error(`Error creating Cabinet-Department mapping: ${error.message}`);
      // Return error instead of throwing
      return {
        success: false,
        message: 'Database error occurred',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
    // return { 'test': 'test', message: 'ItemStockDepartment service is working!', receivedParams: data };
  }

  async getCabinetDepartments(query?: { cabinet_id?: number; department_id?: number; status?: string; keyword?: string }) {
    try {
      const where: any = {};

      if (query?.department_id) {
        where.department_id = query.department_id;
      }

      if (query?.status) {
        where.status = query.status;
      }

      // Handle cabinet_id and keyword filtering
      if (query?.keyword && query.keyword.trim() !== '') {
        // If keyword is provided, find cabinets that match the keyword
        const matchingCabinets = await this.prisma.cabinet.findMany({
          where: {
            OR: [
              { cabinet_name: { contains: query.keyword } },
              { cabinet_code: { contains: query.keyword } }
            ]
          },
          select: {
            id: true,
          },
        });

        const matchingCabinetIds = matchingCabinets.map(cab => cab.id);

        // If no cabinets match, return empty result
        if (matchingCabinetIds.length === 0) {
          return {
            success: true,
            data: [],
            total: 0,
            page: 1,
            limit: 10,
            lastPage: 0,
          };
        }

        // If cabinet_id is also provided, intersect with matching cabinets
        if (query?.cabinet_id) {
          if (matchingCabinetIds.includes(query.cabinet_id)) {
            where.cabinet_id = query.cabinet_id;
          } else {
            // cabinet_id doesn't match keyword, return empty
            return {
              success: true,
              data: [],
              total: 0,
              page: 1,
              limit: 10,
              lastPage: 0,
            };
          }
        } else {
          // Filter mappings by matching cabinet IDs
          where.cabinet_id = {
            in: matchingCabinetIds,
          };
        }
      } else if (query?.cabinet_id) {
        // Only cabinet_id provided, no keyword
        where.cabinet_id = query.cabinet_id;
      }

      const mappings = await this.prisma.cabinetDepartment.findMany({
        where,
        include: {
          department: {
            select: {
              ID: true,
              DepName: true,
              DepName2: true
            },
          },
          cabinet: {
            select: {
              id: true,
              cabinet_name: true,
              cabinet_code: true,
              cabinet_status: true,
              stock_id: true,
            },
          },
        },
        orderBy: { cabinet_id: 'asc' },
      });

      // Get itemstock count for each cabinet
      const mappingsWithCount = await Promise.all(
        mappings.map(async (mapping) => {
          // Use cabinet's stock_id for counting itemstock
          const stockId = mapping.cabinet?.stock_id;

          if (!stockId) {
            return { ...mapping, itemstock_count: 0, itemstock_dispensed_count: 0 };
          }

          const [inCabinetCount, dispensedCount] = await Promise.all([
            this.prisma.itemStock.count({
              where: { StockID: stockId, IsStock: true },
            }),
            this.prisma.itemStock.count({
              where: { StockID: stockId, IsStock: false },
            }),
          ]);

          return {
            ...mapping,
            itemstock_count: inCabinetCount,
            itemstock_dispensed_count: dispensedCount,
          };
        })
      );

      return {
        success: true,
        data: mappingsWithCount,
        total: mappingsWithCount.length,
        page: 1,
        limit: 10,
        lastPage: Math.ceil(mappingsWithCount.length / 10),
      };
    } catch (error) {
      this.logger.error(`Error fetching Cabinet-Department mappings: ${error.message}`);
      return {
        success: false,
        message: 'Failed to fetch mappings',
        error: error.message,
      };
    }
  }

  async updateCabinetDepartment(id: number, data: UpdateCabinetDepartmentDto) {
    try {

      // 1. Validate cabinet, department, and current mapping exist
      const [cabinet, department, currentMapping] = await Promise.all([
        this.prisma.cabinet.findUnique({ where: { id: data.cabinet_id } }),
        this.prisma.department.findUnique({ where: { ID: data.department_id } }),
        this.prisma.cabinetDepartment.findUnique({ where: { id } }),
      ]);

      if (!cabinet || !department) {
        return {
          success: false,
          message: 'Cabinet or Department not found'
        };
      }

      if (!currentMapping) {
        return {
          success: false,
          message: 'CabinetDepartment mapping not found'
        };
      }

      // 2. Check if cabinet_id changed
      if (currentMapping.cabinet_id === data.cabinet_id) {
        // Case 1: Same cabinet_id - can update department_id, status, and description
        const mapping = await this.prisma.cabinetDepartment.update({
          where: { id },
          data: {
            department_id: data.department_id,
            status: data.status,
            description: data.description,
          },
          include: {
            cabinet: true,
            department: {
              select: {
                ID: true,
                DepName: true,
                DepName2: true
              },
            },
          },
        });

        return {
          success: true,
          message: 'Cabinet-Department mapping updated successfully',
          data: mapping,
        };
      } else {
        // Case 2: cabinet_id changed
        // 2.1 ตรวจว่าตู้ใหม่ถูกใช้กับ mapping อื่นอยู่แล้วหรือไม่
        const existingMapping = await this.prisma.cabinetDepartment.findFirst({
          where: {
            cabinet_id: data.cabinet_id,
            id: { not: id }, // Exclude current record
          },
        });

        if (existingMapping) {
          return {
            success: false,
            message: 'New cabinet is already mapped to another department',
          };
        }

        const oldCabinetId = currentMapping.cabinet_id;
        const newCabinetId = data.cabinet_id;

        // 2.2 อัปเดต mapping ไปยัง cabinet ใหม่
        const mapping = await this.prisma.cabinetDepartment.update({
          where: { id },
          data: {
            cabinet_id: newCabinetId,
            department_id: data.department_id,
            status: data.status,
            description: data.description,
          },
          include: {
            cabinet: true,
            department: {
              select: {
                ID: true,
                DepName: true,
                DepName2: true,
              },
            },
          },
        });

        // 2.3 ตั้งสถานะตู้ใหม่ให้เป็น USED (มี mapping อย่างน้อย 1 รายการแล้ว)
        if (newCabinetId) {
          await this.prisma.cabinet.update({
            where: { id: newCabinetId },
            data: { cabinet_status: 'USED' },
          });
        }

        // 2.4 เช็คว่าตู้เก่ายังมีการใช้งานอยู่ไหม ถ้าไม่มีก็เซ็ตเป็น AVAILIABLE
        if (oldCabinetId) {
          const remainingMappingsForOldCabinet = await this.prisma.cabinetDepartment.count({
            where: { cabinet_id: oldCabinetId },
          });

          if (remainingMappingsForOldCabinet === 0) {
            await this.prisma.cabinet.update({
              where: { id: oldCabinetId },
              data: { cabinet_status: 'AVAILIABLE' },
            });
          }
        }

        return {
          success: true,
          message: 'Cabinet-Department mapping updated successfully',
          data: mapping,
        };
      }


    } catch (error) {
      this.logger.error(`Error updating Cabinet-Department mapping: ${error.message}`);
      return {
        success: false,
        message: 'Failed to update mapping',
        error: error.message,
      };
    }
  }

  async deleteCabinetDepartment(id: number) {
    try {
      // หา mapping ก่อนลบ เพื่อดึง cabinet_id เดิม
      const mapping = await this.prisma.cabinetDepartment.findUnique({
        where: { id },
      });

      if (!mapping) {
        return {
          success: false,
          message: 'Cabinet-Department mapping not found',
        };
      }

      const cabinetId = mapping.cabinet_id;

      // ลบ mapping
      await this.prisma.cabinetDepartment.delete({
        where: { id },
      });

      // ถ้าไม่มี mapping อื่นใช้ตู้ใบนี้แล้ว → เซ็ตสถานะเป็น AVAILIABLE
      if (cabinetId) {
        const remainingMappings = await this.prisma.cabinetDepartment.count({
          where: { cabinet_id: cabinetId },
        });

        if (remainingMappings === 0) {
          await this.prisma.cabinet.update({
            where: { id: cabinetId },
            data: { cabinet_status: 'AVAILIABLE' },
          });
        }
      }

      return {
        success: true,
        message: 'Cabinet-Department mapping deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Error deleting Cabinet-Department mapping: ${error.message}`);
      throw new BadRequestException('Failed to delete mapping');
    }
  }

}
