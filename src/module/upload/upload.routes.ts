// dependencies
import { Router } from 'express';

// core
import { asyncHandler } from '../../core/http/async-handler';

// shared
import { validate } from '../../shared/middleware/validate.middleware';

// validation
import { Initiate_upload_schema } from './upload.validation';

// interface
import type { IUploadController } from './upload.interface';

export class UploadRoutes {
    constructor(private controller: IUploadController) {}

    router() {
        const router = Router();

        // Registration & Login
        router.post('/initiate', validate(Initiate_upload_schema), asyncHandler(this.controller.initiate_upload));

        return router;
    }
}
