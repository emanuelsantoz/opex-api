// src/config/cors.ts

export const CORS_CONFIG = {
  // Em produção, você usaria uma variável de ambiente: process.env.ALLOWED_ORIGIN
  allowedOrigins: [
    'http://localhost:5173',
  ],
  allowedHeaders: [
    'x-user-id',
    'x-user-area',
    'x-user-perfil',
    'x-user-superior',
    'content-type',
    'authorization',
    'X-CSRF-Token'
  ],
  allowedMethods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE'
};