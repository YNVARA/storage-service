import { z } from 'zod';

export const Initiate_upload_schema = z.object({
    body: z
        .object({
            file_name: z.string().min(1).max(255),
            file_size: z.number().int().positive(),
            mime_type: z.string(),
            total_chunks: z.number().int().positive(),
        })
});
