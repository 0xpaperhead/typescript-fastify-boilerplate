# TypeScript Node.js Server Boilerplate

A production-ready boilerplate for building high-performance APIs with TypeScript, Fastify, JWT authentication, and Grafana Cloud monitoring.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white)](https://grafana.com/)

## ✨ Features

- 🚀 **High Performance** - Built with Fastify framework
- 🔒 **JWT Authentication** - Multiple token types for different use cases
- 📊 **Monitoring Ready** - Prometheus metrics with Grafana Cloud integration
- 🛡️ **Type Safe** - Full TypeScript with strict mode
- 🧪 **Testing Ready** - Jest setup with coverage reporting
- 🐳 **Docker Ready** - Multi-stage Docker build with Grafana Agent
- 🔧 **Developer Experience** - Hot reload, linting, formatting
- 📝 **API Documentation** - Comprehensive docs and examples
- 🎯 **Production Ready** - Graceful shutdown, error handling, logging

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd token-metadata-service

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Generate API key for JWT signing
npm run keygen
# Select option 2 or 3, copy the generated key to .env as INTERNAL_API_KEY

# Build the project
npm run build

# Start development server
npm run dev
```

The server will start on `http://localhost:8082`

### Quick Test

```bash
# Health check
curl http://localhost:8082/ping

# Generate test JWT
npm run keygen  # Select option 1

# Test authenticated endpoint
curl -X POST http://localhost:8082/ping \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"ip_address": "8.8.8.8"}'
```

## 🏗️ Architecture

### Core Technologies

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify for high performance
- **Authentication**: JWT tokens with multiple types
- **Monitoring**: Prometheus metrics + Grafana Cloud
- **Testing**: Jest with TypeScript support
- **Validation**: TypeBox for request/response schemas
- **Logging**: Fastify built-in logger

### Project Structure

```
├── src/
│   ├── config/           # Configuration and environment
│   ├── handlers/         # Request handlers
│   ├── server/           # Server setup and middleware
│   └── types/            # TypeScript type definitions
├── scripts/              # Utility scripts
├── docker-compose.yml    # Docker deployment
├── Dockerfile           # Container build
└── API.md              # Complete API documentation
```

## 🔐 Authentication

### Token Types

| Type | Expiry | Use Case |
|------|--------|----------|
| **Test JWT** | 1 minute | Development and testing |
| **Service JWT** | Days/Years | Server-to-server communication |
| **Permanent JWT** | Never | Legacy systems (use with caution) |

### Generate Tokens

```bash
npm run keygen
```

Interactive menu with options for:
1. Quick test tokens
2. API keys for environment 
3. Long-lived service tokens
4. Permanent tokens (legacy)

## 📊 Monitoring & Metrics

### Prometheus Metrics

Access metrics at `GET /metrics`:

- **Process Metrics**: CPU, memory, heap usage
- **HTTP Metrics**: Request count, duration, status codes
- **Node.js Metrics**: Event loop lag, GC stats
- **Custom Metrics**: Application-specific metrics

### Grafana Cloud Integration

#### Option 1: Direct Push (Built-in)
```bash
# Set environment variables
GRAFANA_CLOUD_URL=https://prometheus-prod-XX-prod-XX-XXXXX-X.grafana.net/api/prom/push
GRAFANA_CLOUD_USERNAME=your-stack-name
GRAFANA_CLOUD_API_KEY=your-api-key
```

#### Option 2: Grafana Agent (Recommended)
```bash
# Deploy with Docker Compose
docker-compose up -d
```

### Dashboard Setup

1. Import dashboard ID `10826` (Node.js Application Dashboard)
2. Or create custom panels with these queries:
   - Request Rate: `rate(http_requests_total[1m])`
   - Response Time: `http_request_duration_seconds`
   - Error Rate: `rate(http_requests_total{status_code!~"2.."}[1m])`

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev         # Start with hot reload
npm run build       # Build TypeScript
npm run start       # Run production build

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run with coverage

# Code Quality
npm run lint        # Run ESLint
npm run format      # Format with Prettier

# Utilities
npm run keygen      # Generate tokens and API keys
npm run clean       # Clean build artifacts
```

### Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `INTERNAL_API_KEY` - JWT signing secret
- `PORT` - Server port (default: 8080)

**Optional:**
- `GRAFANA_CLOUD_*` - Grafana Cloud integration
- `METRICS_*` - Metrics configuration

## 🐳 Docker Deployment

### Single Container

```bash
docker build -t token-metadata-service .
docker run -p 8082:8082 --env-file .env token-metadata-service
```

### With Grafana Agent

```bash
# Update agent.yml with your Grafana Cloud credentials
docker-compose up -d
```

## 📡 API Endpoints

### Health Check
```bash
GET /ping → "pong"
```

### Authenticated TCP Ping
```bash
POST /ping
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "ip_address": "8.8.8.8"
}
```

### Metrics
```bash
GET /metrics → Prometheus metrics
```

See [API.md](./API.md) for complete API documentation.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm run test:file <pattern>

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🚀 Production Deployment

### Build Optimization

- Multi-stage Docker build for smaller images
- TypeScript compilation with source maps
- Node.js production optimizations

### Security

- JWT token expiration
- CORS configuration
- Input validation with TypeBox
- No sensitive data in logs

### Monitoring

- Graceful shutdown handling
- Health check endpoints
- Comprehensive metrics
- Error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure all checks pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📖 [API Documentation](./API.md)
- 🔧 [Developer Guide](./CLAUDE.md)
- 🎯 [Key Generator Guide](./scripts/README.md)

## 🗺️ Roadmap

- [ ] Rate limiting implementation
- [ ] Database integration examples
- [ ] WebSocket support
- [ ] OpenAPI/Swagger documentation
- [ ] Health check improvements
- [ ] More authentication methods

---

**Built with ❤️ using TypeScript, Fastify, and modern Node.js practices**