import { IsString, IsInt, IsBoolean, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateItemDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    quantity?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    category_id?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    // Medical Supply Item Fields
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    number?: number;

    @IsOptional()
    @IsString()
    item_code?: string;

    @IsOptional()
    @IsString()
    uom?: string;

    @IsOptional()
    @IsString()
    picture_path?: string;

    @IsOptional()
    @IsString()
    size?: string;

    @IsOptional()
    @IsString()
    department?: string;
}
