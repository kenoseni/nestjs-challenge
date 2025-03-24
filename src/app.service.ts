import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  async getWelcome(): Promise<string> {
    return 'Welcome to Broken Record Store API';
  }
}
