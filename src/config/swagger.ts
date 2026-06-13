import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gyaan Chakra API',
      version: '1.0.0',
      description: 'Enterprise-grade backend API for Gyaan Chakra – Quiz & Rewards Platform',
      contact: {
        name: 'Gyaan Chakra Team',
        email: 'support@gyaanchakra.com',
      },
    },
    servers: [
      { url: '/api/v1', description: 'API v1' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
