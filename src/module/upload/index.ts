// dependencies
import type { Express } from 'express';

// core
import type { Module } from '../../core/module';

// init
import { UploadController } from './upload.controller';
import { UploadRoutes } from './upload.routes';

export const uploadModule: Module = {
    name: 'upload',

    register: (app: Express) => {
        const controller = new UploadController();
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
