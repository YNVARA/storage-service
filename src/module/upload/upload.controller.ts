// dependencies
import type { Request, Response, NextFunction } from 'express';

// core
import { getLogger } from '../../core/logger/request-logger';

// interfaces
import type { IUploadController } from './upload.interface';

export class UploadController implements IUploadController {
    private logger = getLogger({ layer: 'controller', module: 'upload' });

    initiate_upload = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const data = req.body;

        return res.status(200).json({ success: true, message: 'Upload initiated', data });
    }

}
