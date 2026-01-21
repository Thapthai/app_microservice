import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DepartmentServiceService } from './department-service.service';
import { CreateDepartmentDto, UpdateDepartmentDto, CreateCabinetDepartmentDto, UpdateCabinetDepartmentDto } from './dto/department.dto';
import { CreateCabinetDto, UpdateCabinetDto } from './dto/cabinet.dto';

@Controller()
export class DepartmentServiceController {
  constructor(private readonly departmentService: DepartmentServiceService) { }

  // Department message patterns
  // @MessagePattern('department.create')
  // createDepartment(@Payload() data: CreateDepartmentDto) {
  //   return this.departmentService.createDepartment(data);
  // }

  @MessagePattern('department.findAll')
  getAllDepartments(@Payload() params?: { page?: number; limit?: number; keyword?: string }) {
    return this.departmentService.getAllDepartments(params);
  }

  // @MessagePattern('department.findOne')
  // getDepartmentById(@Payload() id: number) {
  //   return this.departmentService.getDepartmentById(id);
  // }

  // @MessagePattern('department.update')
  // updateDepartment(@Payload() payload: { id: number; data: UpdateDepartmentDto }) {
  //   return this.departmentService.updateDepartment(payload.id, payload.data);
  // }

  // @MessagePattern('department.delete')
  // deleteDepartment(@Payload() id: number) {
  //   return this.departmentService.deleteDepartment(id);
  // }


  // =========================== Cabinet message patterns ===========================
  @MessagePattern('cabinet.create')
  createCabinet(@Payload() data: CreateCabinetDto) {
    return this.departmentService.createCabinet(data);
  }

  @MessagePattern('cabinet.findAll')
  getAllCabinets(@Payload() query?: { page?: number; limit?: number; keyword?: string }) {
    return this.departmentService.getAllCabinets(query);
  }

  @MessagePattern('cabinet.findOne')
  getCabinetById(@Payload() id: number) {
    return this.departmentService.getCabinetById(id);
  }

  @MessagePattern('cabinet.update')
  updateCabinet(@Payload() payload: { id: number; data: UpdateCabinetDto }) {
    return this.departmentService.updateCabinet(payload.id, payload.data);
  }

  @MessagePattern('cabinet.delete')
  deleteCabinet(@Payload() id: number) {
    return this.departmentService.deleteCabinet(id);
  }

  // =========================== ItemStockDepartment message patterns ===========================
  @MessagePattern('cabinetDepartment.create')
  createCabinetDepartment(@Payload() data: CreateCabinetDepartmentDto) {
    return this.departmentService.createCabinetDepartment(data);
  }

  @MessagePattern('cabinetDepartment.findAll')
  getCabinetDepartments(@Payload() query?: { cabinet_id?: number; department_id?: number; status?: string; keyword?: string }) {
    return this.departmentService.getCabinetDepartments(query);
  }

  @MessagePattern('cabinetDepartment.update')
  updateCabinetDepartment(@Payload() payload: { id: number; data: UpdateCabinetDepartmentDto }) {
    return this.departmentService.updateCabinetDepartment(payload.id, payload.data);
  }

  @MessagePattern('cabinetDepartment.delete')
  deleteCabinetDepartment(@Payload() id: number) {
    return this.departmentService.deleteCabinetDepartment(id);
  }

  // // Helper patterns
  // @MessagePattern('department.getByCabinet')
  // getDepartmentsByCabinet(@Payload() cabinetId: number) {
  //   return this.departmentService.getDepartmentsByCabinet(cabinetId);
  // }

  // @MessagePattern('department.getCabinetsByDepartment')
  // getCabinetsByDepartment(@Payload() departmentId: number) {
  //   return this.departmentService.getCabinetsByDepartment(departmentId);
  // }
}
