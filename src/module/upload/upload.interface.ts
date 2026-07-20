import type { Request, Response, NextFunction } from 'express';

export interface IUploadController {
    initiate_upload(req: Request, res: Response, next: NextFunction): Promise<any>;
}
