declare module 'fastify-metrics' {
  import { FastifyPluginCallback } from 'fastify';
  
  interface FastifyMetricsOptions {
    defaultMetrics?: {
      enabled?: boolean;
    };
    endpoint?: {
      url?: string;
    };
    name?: string;
    routeMetrics?: {
      enabled?: boolean;
    };
  }
  
  const fastifyMetrics: FastifyPluginCallback<FastifyMetricsOptions>;
  export default fastifyMetrics;
}