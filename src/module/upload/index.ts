// dependencies
import type { Express } from 'express';

// core
import type { Module } from '../../core/module';

// init
import { UploadRepository } from './upload.repository';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { UploadRoutes } from './upload.routes';

export const uploadModule: Module = {
    name: 'upload',

    register: (app: Express, container) => {
        const db = container.db.get('second');
        const repo = new UploadRepository(db);
        const service = new UploadService(repo, container);
        const controller = new UploadController(service);
        const routes = new UploadRoutes(controller);

        app.use('/upload', routes.router());
    },

    async onInit(container) {
        container.logger.info({ module: 'upload' }, 'Upload module initialized');
    },

    async onDestroy(container) {
        container.logger.info({ module: 'upload' }, 'Upload module destroyed');
    },
};
