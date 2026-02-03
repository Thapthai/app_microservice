import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateCabinetDto {
    @IsString()
    @IsOptional()
    cabinet_name?: string;

    @IsString()
    @IsOptional()
    cabinet_code?: string;

    @IsString()
    @IsOptional()
    cabinet_type?   : string;

    @IsInt()
    @IsOptional()
    stock_id?   : number;

    @IsString()
    @IsOptional()
    cabinet_status?: string;

    /** แผนก (ใช้ RefDepID สำหรับสร้างรหัสตู้ เช่น VTN-ER-001) */
    @IsInt()
    @IsOptional()
    department_id?: number;
}

export class UpdateCabinetDto {
    @IsString()
    @IsOptional()
    cabinet_name?: string;

    @IsString()
    @IsOptional()
    cabinet_code?: string;  

    @IsString()
    @IsOptional()
    cabinet_type?: string;

    @IsInt()
    @IsOptional()
    stock_id?   : number;

    @IsString()
    @IsOptional()
    cabinet_status?: string;    
}   