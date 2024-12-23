import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ItemStatus } from '../../common/enum/statusItem';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  quantity: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  amount: number;

  @IsEnum(ItemStatus)
  @IsOptional()
  status: ItemStatus = ItemStatus.PENDING;
}
