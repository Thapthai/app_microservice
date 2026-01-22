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