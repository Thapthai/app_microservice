import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    quantity?: number;

    @IsOptional()
    @IsNumber()
    category_id?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

}

export class UpdateItemDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    quantity?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    category_id?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
