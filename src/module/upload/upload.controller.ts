// dependencies
import type { Request, Response, NextFunction } from 'express';

// core
import { getLogger } from '../../core/logger/request-logger';

// interfaces
import type { IUploadService } from './upload.interface';
import type { IUploadController } from './upload.interface';

export class UploadController implements IUploadController {
    private logger = getLogger({ layer: 'controller', module: 'upload' });
    constructor(private service: IUploadService) {}

    initiate_upload = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const data = req.body;
        const response = await this.service.initiate_upload(data);
        return res.status(200).json({ success: true, message: 'Upload initiated', data: response });
    };
}
