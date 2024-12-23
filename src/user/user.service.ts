import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { BcryptService } from '../common/services/bcrypt.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly bcryptService: BcryptService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await this.bcryptService.hashPassword(
      createUserDto.password,
    );
    const newUser = {
      ...createUserDto,
      password: hashedPassword,
    };

    return this.userRepository.save(newUser);
  }

  async findUserWithPassword(email: string): Promise<User> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'password', 'fingerprintId', 'name'],
    });
  }

  async validateBiometricAuth(
    email: string,
    fingerprintId: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return false;
    return user.fingerprintId === fingerprintId;
  }
}
