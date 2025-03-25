import { z } from 'zod';

/**
 * Start conversion schema
 */
export const startConversionSchema = z.object({
  body: z.object({
    conversionType: z.enum(['pdf-to-docx', 'docx-to-pdf'], {
      errorMap: () => ({ message: 'Conversion type must be either pdf-to-docx or docx-to-pdf' }),
    }),
  }),
});

/**
 * Get conversion status schema
 */
export const getConversionStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid conversion ID format',
    }),
  }),
});

/**
 * List conversions schema
 */
export const listConversionsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, { message: 'Page must be a positive number' })
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, { message: 'Limit must be a positive number' })
      .transform(Number)
      .optional(),
    status: z
      .enum(['pending', 'processing', 'completed', 'failed', 'all'], {
        errorMap: () => ({
          message: 'Status must be one of: pending, processing, completed, failed, all',
        }),
      })
      .optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'status'], {
      errorMap: () => ({ message: 'Invalid sort field' }),
    }).optional(),
    sortOrder: z.enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Sort order must be asc or desc' }),
    }).optional(),
  }).optional(),
});