import * as dotenv from 'dotenv';

dotenv.config();

export const AppConfig = {
  mongoUrl: 'MONGO_URL',
  port: process.env.PORT || 4118,
};
