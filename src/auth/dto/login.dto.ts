import { IsString, IsEmail, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsString()
  email: string;

  @ValidateIf((o) => !o.fingerprintId)
  @MinLength(8)
  @IsString()
  password: string;

  @ValidateIf((o) => !o.password)
  @IsString()
  fingerprintId?: string;
}
