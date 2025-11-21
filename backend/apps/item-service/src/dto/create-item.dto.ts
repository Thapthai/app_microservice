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

    // Medical Supply Item Fields
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    number?: number; // ลำดับที่

    @IsOptional()
    @IsString()
    item_code?: string; // ItemCode (S4214NACISP10)

    @IsOptional()
    @IsString()
    uom?: string; // Unit of Measure (ชิ้น, Each, ชุด)

    @IsOptional()
    @IsString()
    picture_path?: string; // Path รูปภาพ (เช่น /items/images/item-xxx.jpg)

    @IsOptional()
    @IsString()
    size?: string; // ขนาด (4*23 cm)

    @IsOptional()
    @IsString()
    department?: string; // แผนก (Emergency Department)
}
