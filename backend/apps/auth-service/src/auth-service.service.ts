import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterDto } from './auth-service.controller';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthServiceService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Create user
      const newUser = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
        },
      });

      // Generate JWT token
      const payload = { sub: newUser.id, email: newUser.email, name: newUser.name };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: { id: newUser.id, email: newUser.email, name: newUser.name },
          token,
        },
      };
    } catch (error) {
      return { success: false, message: 'Registration failed', error: error.message };
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Generate JWT token
      const payload = { sub: user.id, email: user.email, name: user.name };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: { id: user.id, email: user.email, name: user.name },
          token,
        },
      };
    } catch (error) {
      return { success: false, message: 'Login failed', error: error.message };
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      return {
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: user.name },
        },
      };
    } catch (error) {
      return { success: false, message: 'Invalid token', error: error.message };
    }
  }
}
