import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  // Inject JwtService
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerUser(
    name: string,
    email: string,
    password: string,
    roleName: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check existing user
      const existing = await tx.users.findUnique({
        where: { email },
      });

      if (existing) {
        throw new BadRequestException('Email already registered');
      }

      // 2. Validate role exists
      const role = await tx.roles.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        throw new BadRequestException('Invalid role provided');
      }

      // 3. Hash password
      const hash = await bcrypt.hash(password, 10);

      // 4. Create user
      const user = await tx.users.create({
        data: {
          full_name: name,
          email,
          password_hash: hash,
        },
      });

      // 5. Assign role
      await tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id: role.id,
        },
      });

      // 6. Generate JWT payload
      const payload = {
        sub: user.id,
        email: user.email,
        role: role.name,
      };

      // 7. Sign token
      const access_token = this.jwtService.sign(payload);

      // 8. Return response
      return {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: role.name,
          created_at: user.created_at,
        },
        access_token,
      };
    });
  }

  async loginUser(email: string, password: string) {
    // 1. Find user with roles
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Account is disabled');
    }

    // 2. Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Extract role names
    const roles = user.user_roles.map((ur) => ur.roles.name);

    // 4. JWT Payload
    const payload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    // 5. Sign token
    const token = this.jwtService.sign(payload);

    // 6. Return safe response
    return {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        roles,
      },
    };
  }
}
