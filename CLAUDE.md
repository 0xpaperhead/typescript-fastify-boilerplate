# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript Node.js server that provides a token metadata service with JWT authentication. Built with Fastify framework for high performance, it includes Prometheus metrics integration for Grafana Cloud monitoring.

## Key Commands

### Development
```bash
npm run dev         # Start development server with hot reload (uses tsx)
npm run build       # Compile TypeScript to JavaScript (dist folder)
npm run clean       # Remove build artifacts
```

### Testing
```bash
npm test            # Run all tests
npm run test:file   # Run specific test file (pass pattern as argument)
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci     # Run tests in CI mode with coverage
```

### Code Quality
```bash
npm run lint        # Run ESLint on .ts and .js files
npm run format      # Format code with Prettier
npm run format:check # Check code formatting without changes
```

### Production
```bash
npm start           # Run production server (requires npm run build first)
```

### Key Generation
```bash
npm run keygen      # Interactive key generator for JWT tokens and API keys
```

Available token types:
- **JWT Token** (1 minute) - Quick testing token
- **Custom JWT Token** - Configurable expiry and issuer
- **Service JWT** (long-lived) - 30 days to 1 year for server-to-server
- **Permanent Service JWT** - Never expires (use with extreme caution)
- **API Keys** - For INTERNAL_API_KEY environment variable

## Architecture Overview

### Core Server Structure
The service uses Fastify framework with a clean separation of concerns:

1. **Entry Point** (`src/index.ts`): Validates environment variables and starts the server
2. **Server Layer** (`src/server/index.ts`): Fastify server setup with plugins, routes, and graceful shutdown
3. **Authentication** (`@fastify/jwt` plugin): JWT-based authentication with custom decorator
4. **Handlers** (`src/handlers/`): Business logic for each endpoint
5. **Metrics** (`fastify-metrics` + `prom-client`): Prometheus metrics with Grafana Cloud push support

### Authentication Flow
- Uses JWT tokens with INTERNAL_API_KEY for signing
- Bearer token authentication required for protected endpoints
- Token validation happens via Fastify JWT plugin and custom authenticate decorator
- **Three token types available**:
  - **Short-lived JWT** (1 minute) - for user sessions and testing
  - **Service JWT** (30 days to 1 year) - for server-to-server communication
  - **Permanent JWT** (never expires) - for legacy systems (use with caution)

### Request Flow
1. Request arrives at Fastify server
2. CORS headers are set via @fastify/cors plugin
3. Public endpoints (GET /ping) bypass authentication
4. Protected endpoints (POST /ping) require valid JWT token via authenticate decorator
5. Request body is validated using TypeBox schemas
6. Handler processes the request
7. Response is sent as JSON

### Current Endpoints
- `GET /ping` - Public health check
- `POST /ping` - Authenticated TCP ping service (measures latency to IP addresses)
- `GET /metrics` - Prometheus metrics endpoint

## Environment Configuration

Required environment variables:
- `INTERNAL_API_KEY` - Secret key for JWT signing (required)
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment mode (development/test/production)

Optional Grafana Cloud variables:
- `GRAFANA_CLOUD_URL` or `PROMETHEUS_PUSH_URL` - Grafana Cloud Prometheus push URL
- `GRAFANA_CLOUD_USERNAME` - Your Grafana Cloud username/stack name
- `GRAFANA_CLOUD_API_KEY` - Your Grafana Cloud API key
- `METRICS_PUSH_INTERVAL` - Push interval in ms (default: 15000)
- `METRICS_JOB_NAME` - Job name for metrics (default: token-metadata-service)

## Metrics and Monitoring

### Metrics Collection
The service exposes Prometheus metrics at `/metrics` endpoint including:
- Default Node.js process metrics
- HTTP route metrics (request count, duration, etc.)
- Custom application metrics

### Grafana Cloud Integration
Two deployment options:

1. **Direct Push** (built-in): Configure environment variables and the service will push metrics directly
2. **Grafana Agent** (recommended): Use docker-compose.yml to run with Grafana Agent for scraping

### Grafana Dashboard
Import dashboard ID 10826 (Node.js Application Dashboard) in Grafana Cloud or create custom panels for:
- Request rate: `rate(http_requests_total[1m])`
- Response time: `http_request_duration_seconds`
- Error rate: `rate(http_requests_total{status_code!~"2.."}[1m])`

## TypeScript Configuration

- Target: ES2022 with NodeNext module system
- Strict mode enabled
- Source maps for debugging
- Separate configs for build (`tsconfig.build.json`) and test (`tsconfig.test.json`)
- Custom type declarations in `src/types/`

## Testing Setup

- Jest with ts-jest for TypeScript support
- ESM modules configuration
- Test files location: `src/__tests__/*.test.ts`
- Setup file: `src/__tests__/setup.ts`
- Sequential test execution to avoid API rate limits
- 2-minute timeout for integration tests

## Docker Deployment

The project includes:
- `Dockerfile` for containerized deployment
- `docker-compose.yml` for running with Grafana Agent
- `agent.yml` for Grafana Agent configuration

To deploy with Docker:
```bash
docker-compose up -d
```

## JWT Token Management

### Token Types and Use Cases

| Token Type | Expiry | Use Case | Security Level |
|------------|--------|----------|----------------|
| **Short-lived JWT** | 1 minute | User sessions, API testing | High |
| **Service JWT** | 30 days - 1 year | Server-to-server communication | Medium |
| **Permanent JWT** | Never | Legacy systems only | Low |

### Token Structure

All JWTs contain these claims:
- `iss` (issuer) - Service or user identifier
- `iat` (issued at) - Token creation timestamp
- `exp` (expires) - Expiration timestamp (except permanent tokens)
- `type` - Token type (`service` or `service-permanent`)

### Server-to-Server Authentication

For service-to-service communication:

1. **Generate a service JWT**:
   ```bash
   npm run keygen
   # Select option 5 for long-lived service JWT
   # Enter service name: "analytics-service"
   # Enter validity: 365 days
   ```

2. **Store in client service**:
   ```bash
   # In your client service's .env
   SERVICE_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Use in HTTP requests**:
   ```bash
   curl -H "Authorization: Bearer $SERVICE_JWT" \
        http://token-metadata-service/ping
   ```

### Token Security Best Practices

- ✅ Use **service JWTs** for server-to-server communication
- ✅ Store tokens as environment variables
- ✅ Use descriptive service names in `iss` claim
- ✅ Rotate service tokens periodically
- ❌ Avoid permanent tokens unless absolutely necessary
- ❌ Never commit tokens to version control
- ❌ Don't use short-lived tokens for automated systems

## Important Notes

- The codebase uses ES modules (`.js` extensions in imports)
- JWT tokens are signed with INTERNAL_API_KEY
- Server implements graceful shutdown on SIGTERM/SIGINT
- TCP ping attempts multiple ports (443, 80, 22) for reliability
- All JSON responses follow a consistent error format
- Fastify provides built-in request logging and validation
- Type-safe request/response handling with TypeBox schemas