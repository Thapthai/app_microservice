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
    @IsString()
    category?: string;

    @IsBoolean()
    isActive?: boolean;

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
    @IsString()
    category?: string;

    @IsBoolean()
    isActive?: boolean;
}
