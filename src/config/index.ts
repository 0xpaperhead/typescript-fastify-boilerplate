import dotenv from 'dotenv';
dotenv.config();

export const Config = {
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8080'),
    apiKey: process.env.INTERNAL_API_KEY!,
  }
}