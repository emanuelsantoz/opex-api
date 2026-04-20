import type { NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { AppError } from './errors';

type ResponseSuccess<T> = {
  success: true;
  data: T;
};

type ResponseError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ResponseSuccess<T> | ResponseError;

export function successResponse<T>(data: T, statusCode = 200) {
  return {
    statusCode,
    body: { success: true, data } as ResponseSuccess<T>,
  };
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      } as ResponseError,
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      } as ResponseError,
    };
  }

  console.error('[Unhandled Error]', error);

  return {
    statusCode: 500,
    body: {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      },
    } as ResponseError,
  };
}

export function withErrorHandler<T>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<T>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const result = await handler(req, res);
      return result;
    } catch (error) {
      const { statusCode, body } = errorResponse(error);
      return res.status(statusCode).json(body);
    }
  };
}
