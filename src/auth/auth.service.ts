import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BcryptService } from '../common/services/bcrypt.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
  ) {}

  private generateToken(user: User): string {
    const payload = {
      id: user.id,
    };
    return this.jwtService.sign(payload);
  }

  async registerUser(registerDto: RegisterDto): Promise<User> {
    return this.userService.createUser(registerDto);
  }

  async loginUser({ email, password, fingerprintId }: LoginDto) {
    const findUser = await this.userService.findUserWithPassword(email);

    if (!findUser) {
      throw new UnauthorizedException('User not found');
    }

    if (password) {
      const isPasswordValid = await this.bcryptService.comparePassword(
        password,
        findUser.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }
    } else if (fingerprintId) {
      const isFingerprintValid = await this.userService.validateBiometricAuth(
        email,
        fingerprintId,
      );
      if (!isFingerprintValid) {
        throw new UnauthorizedException('Invalid fingerprint');
      }
    } else {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const accessToken = this.generateToken(findUser);

    return {
      accessToken,
      id: findUser.id,
      name: findUser.name,
    };
  }
}
