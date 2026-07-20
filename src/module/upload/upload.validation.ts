import { z } from 'zod';
export const Initiate_upload_schema = z.object({
    body: z.object({
        original_file_name: z.string().min(1).max(255),
        extension: z.string().max(20).optional(),
        file_size: z.number().int().positive(),
        mime_type: z.string(),
        total_chunks: z.number().int().positive(),
    }),
});
