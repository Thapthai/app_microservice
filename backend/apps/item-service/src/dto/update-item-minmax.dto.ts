import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateItemMinMaxDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  Minimum?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  Maximum?: number;
}

