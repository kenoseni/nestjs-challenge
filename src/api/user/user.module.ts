import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [UserService, AuthService],
  controllers: [UserController, AuthController],
  exports: [UserService],
})
export class UserModule {}
