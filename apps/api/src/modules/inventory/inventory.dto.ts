import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString() name!: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() category?: string;
  @IsString() unit!: string;
  @IsNumber() @Min(0) quantity!: number;
  @IsOptional() @IsNumber() @Min(0) minQuantity?: number;
  @IsOptional() @IsString() location?: string;
}

export class StockMovementDto {
  @IsString() type!: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
  @IsNumber() quantity!: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() reference?: string;
}
