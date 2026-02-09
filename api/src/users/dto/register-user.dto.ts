import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsIn(['ADMIN', 'ORGANIZER', 'REVIEWER', 'SPEAKER'])
  role: string;
}
