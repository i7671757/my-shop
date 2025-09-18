import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.reduce((acc, curr) => {
        const path = curr.path.join('.');
        if (!acc[path]) {
          acc[path] = [];
        }
        acc[path].push(curr.message);
        return acc;
      }, {} as Record<string, string[]>);

      return { success: false, errors };
    }
    return { success: false, errors: { _general: ['Validation failed'] } };
  }
}

export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const result = validateRequest(schema, body);

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Validation failed', details: result.errors },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
}

export function createValidationMiddleware<T>(schema: ZodSchema<T>) {
  return async (request: NextRequest) => {
    const result = await validateRequestBody(request, schema);
    if (!result.success) {
      return result.response;
    }
    return result.data;
  };
}