# Token Metadata Service API Documentation

## Overview

RESTful API service built with Fastify providing token metadata operations with JWT authentication and Prometheus metrics.

## Base URL

```
http://localhost:8082
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Token Types

| Type | Expiry | Use Case | Generation |
|------|--------|----------|------------|
| **Test JWT** | 1 minute | API testing | `npm run keygen` → Option 1 |
| **Custom JWT** | Configurable | Custom sessions | `npm run keygen` → Option 4 |
| **Service JWT** | 30 days - 1 year | Server-to-server | `npm run keygen` → Option 5 |
| **Permanent JWT** | Never | Legacy systems | `npm run keygen` → Option 6 |

## Endpoints

### Health Check

#### `GET /ping`

Public endpoint for health checking.

**Request:**
```bash
curl http://localhost:8082/ping
```

**Response:**
```
pong
```

**Status Codes:**
- `200` - Service is healthy

---

### TCP Ping Service

#### `POST /ping`

Authenticated endpoint that performs TCP ping to specified IP address.

**Authentication:** Required

**Request:**
```bash
curl -X POST http://localhost:8082/ping \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"ip_address": "8.8.8.8"}'
```

**Request Body:**
```json
{
  "ip_address": "8.8.8.8"
}
```

**Request Schema:**
- `ip_address` (string, required) - Valid IPv4 address

**Response:**
```json
{
  "success": true,
  "ip": "8.8.8.8",
  "average_ping_ms": 7,
  "individual_times_ms": [7, 6, 8],
  "port_used": 443
}
```

**Response Schema:**
- `success` (boolean) - Operation success status
- `ip` (string) - The IP address that was pinged
- `average_ping_ms` (number) - Average ping time in milliseconds
- `individual_times_ms` (array) - Individual ping times for each attempt
- `port_used` (number) - The port that was successfully used for ping

**Status Codes:**
- `200` - Successful ping
- `400` - Invalid IP address format or missing ip_address
- `401` - Invalid or missing authentication token
- `500` - Internal server error (all ports failed, etc.)

**Error Response:**
```json
{
  "success": false,
  "error": {
    "source": "internal",
    "code": "00000",
    "message": "All ping attempts failed on all ports",
    "function": "handlePing"
  }
}
```

---

### Metrics

#### `GET /metrics`

Prometheus metrics endpoint exposing application and system metrics.

**Request:**
```bash
curl http://localhost:8082/metrics
```

**Response:**
```
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.183766

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/ping",status_code="200"} 5

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.005",method="POST",route="/ping"} 2
...
```

**Status Codes:**
- `200` - Metrics available

**Available Metrics:**
- **Process Metrics**: CPU usage, memory usage, heap size
- **HTTP Metrics**: Request count, duration, status codes by route
- **Node.js Metrics**: Event loop lag, garbage collection stats
- **Custom Metrics**: Application-specific metrics

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "source": "internal",
    "code": "00000", 
    "message": "Descriptive error message",
    "function": "handlePing"
  }
}
```

### Common Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| `400` | Bad Request | Invalid request format or parameters |
| `401` | Unauthorized | Missing or invalid JWT token |
| `404` | Not Found | Endpoint not found |
| `500` | Internal Server Error | Server-side error |

## JWT Token Structure

### Standard Claims

All JWT tokens include:
- `iss` (issuer) - Service or user identifier
- `iat` (issued at) - Token creation timestamp
- `exp` (expires) - Expiration timestamp (except permanent tokens)

### Service Token Claims

Service tokens additionally include:
- `type` - Token type (`"service"` or `"service-permanent"`)

### Example Token Payloads

**Test Token:**
```json
{
  "iss": "test-client",
  "exp": 1753850886,
  "iat": 1753850826
}
```

**Service Token:**
```json
{
  "iss": "payment-service",
  "type": "service",
  "exp": 1756442826,
  "iat": 1753850826
}
```

**Permanent Service Token:**
```json
{
  "iss": "legacy-system",
  "type": "service-permanent", 
  "iat": 1753850826
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting based on:
- JWT issuer (`iss` claim)
- IP address
- Token type

## CORS

CORS is enabled for all origins with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Server-to-Server Integration

### Step 1: Generate Service JWT

```bash
npm run keygen
# Select option 5 (Service JWT)
# Enter service name: your-service-name
# Enter validity: 365 (days)
```

### Step 2: Store Token Securely

```bash
# In your client service's .env file
SERVICE_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Use in HTTP Requests

```javascript
// Example in Node.js
const response = await fetch('http://token-metadata-service:8082/ping', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.SERVICE_JWT}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ip_address: '8.8.8.8' })
});
```

## Security Considerations

- Store JWT tokens securely as environment variables
- Use service JWTs (not permanent) for server-to-server communication
- Rotate service tokens periodically
- Monitor token usage via application logs
- Never commit tokens to version control
- Use HTTPS in production environments