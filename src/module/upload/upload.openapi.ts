export const uploadOpenApi = {
    paths: {
        '/upload/initiate': {
            post: {
                tags: ['Upload'],
                summary: 'Initiate a file upload',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/InitiateUploadRequest' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Upload initiated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        message: { type: 'string', example: 'Upload initiated' },
                                        data: { $ref: '#/components/schemas/InitiateUploadRequest' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            InitiateUploadRequest: {
                type: 'object',
                required: ['original_file_name', 'file_size', 'mime_type', 'total_chunks'],
                properties: {
                    original_file_name: { type: 'string', minLength: 1, maxLength: 255 },
                    extension: { type: 'string', maxLength: 20 },
                    file_size: { type: 'integer', minimum: 1 },
                    mime_type: { type: 'string' },
                    total_chunks: { type: 'integer', minimum: 1 },
                },
                example: {
                    original_file_name: 'example-video.mp4',
                    extension: '.mp4',
                    file_size: 10485760,
                    mime_type: 'video/mp4',
                    total_chunks: 10,
                },
            },
        },
    },
};
