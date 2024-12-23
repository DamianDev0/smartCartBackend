import { IsOptional, IsString } from 'class-validator';

export class CreateShoppingListDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  context?: string;
}
