import type { Request, Response, NextFunction } from 'express';

export type InitUpload = {
    original_file_name: string;
    extension?: string;
    file_size: number;
    mime_type: string;
    total_chunks: number;
};

export interface IUploadController {
    initiate_upload(req: Request, res: Response, next: NextFunction): Promise<any>;
}

export interface IUploadService {
    initiate_upload(data: InitUpload): Promise<any>;
}

export interface IUploadRepository {
    initiate_upload(data: InitUpload): Promise<any>;
}
