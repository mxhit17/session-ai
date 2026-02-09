import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    const { name, email, password, role } = body;
    return this.usersService.registerUser(
      name,
      email,
      password,
      role,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserDto) {
    const { email, password } = body;
    return this.usersService.loginUser(email, password);
  }

  // Protected
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SPEAKER', 'ADMIN')
  getProfile(@Req() req) {
    return req.user;
  }
}
