import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateItemMinMaxDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_max?: number;
}

