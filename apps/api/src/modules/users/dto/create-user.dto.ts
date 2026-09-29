import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() @MaxLength(100) firstName!: string;
  @IsString() @MaxLength(100) lastName!: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MinLength(12) password?: string;
  @IsOptional() @IsString() @MaxLength(5) locale?: string;
  @IsOptional() @IsString() @MaxLength(40) theme?: string;
}
