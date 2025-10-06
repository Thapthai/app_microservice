import { Type } from 'class-transformer';
import { IsString, IsInt, IsBoolean, IsDateString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';

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
    @Type(() => Number)
    category_id?: number;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

}
