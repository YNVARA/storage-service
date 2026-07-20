// core
import { getLogger } from '../../core/logger/request-logger';

// interface
import type { IUploadRepository } from './upload.interface';
import type { IUploadService } from './upload.interface';
import type { InitUpload } from './upload.interface';

export class UploadService implements IUploadService {
    private logger = getLogger({ layer: 'service', module: 'upload' });

    constructor(
        private repo: IUploadRepository,
        private container: any,
    ) {}

    async initiate_upload(data: InitUpload): Promise<any> {
        const response = await this.repo.initiate_upload(data);
        return response;
    }
}
