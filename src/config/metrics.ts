import { FastifyInstance } from 'fastify';
import { Pushgateway, register } from 'prom-client';

// Grafana Cloud configuration for metrics
export interface MetricsConfig {
  grafanaCloudUrl?: string;
  grafanaCloudUsername?: string;
  grafanaCloudApiKey?: string;
  pushInterval?: number;
  jobName?: string;
}

export function getMetricsConfig(): MetricsConfig {
  return {
    grafanaCloudUrl: process.env.GRAFANA_CLOUD_URL || process.env.PROMETHEUS_PUSH_URL,
    grafanaCloudUsername: process.env.GRAFANA_CLOUD_USERNAME,
    grafanaCloudApiKey: process.env.GRAFANA_CLOUD_API_KEY,
    pushInterval: parseInt(process.env.METRICS_PUSH_INTERVAL || '15000'), // 15 seconds default
    jobName: process.env.METRICS_JOB_NAME || 'token-metadata-service'
  };
}

// Setup push gateway for Grafana Cloud
export async function setupGrafanaCloudMetrics(app: FastifyInstance) {
  const config = getMetricsConfig();
  
  if (!config.grafanaCloudUrl || !config.grafanaCloudUsername || !config.grafanaCloudApiKey) {
    app.log.warn('Grafana Cloud configuration not found. Metrics will only be available via /metrics endpoint');
    app.log.info('To enable Grafana Cloud metrics, set the following environment variables:');
    app.log.info('  GRAFANA_CLOUD_URL (or PROMETHEUS_PUSH_URL): Your Grafana Cloud Prometheus push URL');
    app.log.info('  GRAFANA_CLOUD_USERNAME: Your Grafana Cloud username/stack name');
    app.log.info('  GRAFANA_CLOUD_API_KEY: Your Grafana Cloud API key');
    return;
  }

  // Configure push gateway for Grafana Cloud
  const gateway = new Pushgateway(config.grafanaCloudUrl, {
    auth: `${config.grafanaCloudUsername}:${config.grafanaCloudApiKey}`,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    }
  });

  // Function to push metrics
  const pushMetrics = async () => {
    try {
      await gateway.pushAdd({ jobName: config.jobName! });
      app.log.debug('Successfully pushed metrics to Grafana Cloud');
    } catch (error) {
      app.log.error('Error pushing metrics to Grafana Cloud:', error);
    }
  };

  // Push metrics immediately on startup (after a delay)
  setTimeout(pushMetrics, 5000); // Wait 5 seconds for server to fully start

  // Then push periodically
  const interval = setInterval(pushMetrics, config.pushInterval!);
  
  // Clean up on shutdown
  app.addHook('onClose', async () => {
    clearInterval(interval);
    // Push final metrics before shutdown
    try {
      await pushMetrics();
    } catch (error) {
      app.log.error('Error pushing final metrics:', error);
    }
  });
  
  app.log.info(`Grafana Cloud metrics push configured:`);
  app.log.info(`  URL: ${config.grafanaCloudUrl}`);
  app.log.info(`  Job Name: ${config.jobName}`);
  app.log.info(`  Push Interval: ${config.pushInterval}ms`);
}