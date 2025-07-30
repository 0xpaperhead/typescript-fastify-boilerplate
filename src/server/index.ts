/* eslint-disable no-console */
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyMetrics from 'fastify-metrics';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Config } from '../config/index.js';
import { handlePing } from '../handlers/handlePing.js';
import { RouteHandlerMethod } from 'fastify';
import { Type } from '@sinclair/typebox';
import { setupGrafanaCloudMetrics } from '../config/metrics.js';

// Extend FastifyInstance with authenticate and update JWT payload type
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      iss: string;
      exp: number;
    };
    user: {
      iss: string;
      exp: number;
    };
  }
}

export function createApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: Config.server.env === 'production' ? 'info' : 'debug'
    }
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register plugins
  app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  app.register(jwt, {
    secret: Config.server.apiKey
  });

  // Register metrics plugin for Grafana Cloud
  app.register(fastifyMetrics, {
    defaultMetrics: { enabled: true },
    endpoint: {
      url: '/metrics'
    },
    name: 'token_metadata_service',
    routeMetrics: { enabled: true }
  });

  // Authentication hook
  app.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Invalid auth token' });
    }
  });

  // Public endpoints
  app.get('/ping', async (_request, _reply) => {
    return 'pong';
  });

  // Protected endpoints
  app.post('/ping', {
    onRequest: [app.authenticate],
    schema: {
      body: Type.Object({
        ip_address: Type.String()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          ip: Type.String(),
          average_ping_ms: Type.Number(),
          individual_times_ms: Type.Array(Type.Number()),
          port_used: Type.Number()
        }),
        400: Type.Object({
          error: Type.String()
        }),
        401: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          success: Type.Boolean(),
          error: Type.Object({
            source: Type.String(),
            code: Type.String(),
            message: Type.String(),
            function: Type.String()
          })
        })
      }
    }
  }, handlePing as RouteHandlerMethod);

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: 'Not found' });
  });

  // Error handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.status(500).send({
      success: false,
      error: {
        source: 'internal',
        code: '00000',
        message: error.message || 'Internal server error',
        function: 'server/index'
      }
    });
  });

  return app;
}

export async function startServer(port: number = Config.server.port) {
  const app = createApp();
  let shuttingDown = false;

  // Graceful shutdown handler
  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n${signal} received. Starting graceful shutdown...`);

    try {
      await app.close();
      console.log('HTTP server closed');
      console.log('Cleanup completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Handle different termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT')); // Handles Ctrl+C
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port: ${port}`);
    
    // Setup Grafana Cloud metrics push
    await setupGrafanaCloudMetrics(app);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}