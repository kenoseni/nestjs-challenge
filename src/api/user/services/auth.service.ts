import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(username: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const payload = { username: user.username, roles: user.roles };

    try {
      const token = this.jwtService.sign(payload);
      return { token };
    } catch (error) {
      console.error('Error while signing token', error);
      throw new HttpException(
        'Something went wrong during user login',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
