import type { DatabaseClient, TransactionClient } from '../../config/database/types';
import type { IUploadRepository } from './upload.interface';
import type { InitUpload } from './upload.interface';

export class UploadRepository implements IUploadRepository {
    constructor(private readonly db: DatabaseClient) {}

    async initiate_upload(data: InitUpload): Promise<any> {
        const query = `
            INSERT INTO storage.sessions (
                original_file_name,
                file_name,
                extension,
                file_size,
                mime_type,
                total_chunks,
                status
            ) VALUES (
                $1, gen_random_uuid(), $2, $3, $4, $5, 'UPLOADING'
            ) RETURNING id;
        `;
        const values = [data.original_file_name, data.extension, data.file_size, data.mime_type, data.total_chunks];
        const result = await this.db.query(query, values);
        return result.rows[0];
    }
}
