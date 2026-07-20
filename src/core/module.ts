import type { Express } from 'express';
import type { Container } from './container';

export interface Module {
    name: string;

    // REGISTER HTTP ROUTES
    register: (app: Express, container: Container) => void;

    // OPTIONAL LIFECYCLE HOOKS
    onInit?: (container: Container) => Promise<void>;
    onDestroy?: (container: Container) => Promise<void>;
}
