import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(private userService: UserService) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  async seedUsers() {
    const seedUsers = [
      { username: 'king', roles: ['creator', 'customer'] },
      { username: 'queen', roles: ['creator'] },
      { username: 'james', roles: ['customer'] },
    ];

    for (const userData of seedUsers) {
      const existingUser = await this.userService.findByUsername(
        userData.username,
      );
      if (!existingUser) {
        await this.userService.createUser(userData);
      }
    }
  }
}
