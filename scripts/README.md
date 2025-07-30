# Key Generator Script

A utility script for generating JWT tokens and API keys for the Token Metadata Service.

## Usage

```bash
npm run keygen
```

## Features

### 1. Generate JWT Token (Quick)
Generates a JWT token with default settings:
- Issuer: `test-client`
- Expiry: 1 minute
- Shows curl command for testing

### 2. Generate API Key
Generates a random 32-byte API key suitable for `INTERNAL_API_KEY` in your `.env` file.

### 3. Generate Secure API Key
Generates a structured API key with prefix `sk-proj-` followed by random bytes.

### 4. Generate Custom JWT Token
Allows you to specify:
- Custom issuer name
- Custom expiry time (in minutes)

### 5. Generate Service JWT (Long-lived)
Creates long-lived JWTs for server-to-server communication:
- Custom service name as issuer
- Configurable expiry (30 days to multiple years)
- Includes `type: "service"` claim
- Perfect for microservices architecture

### 6. Generate Permanent Service JWT
Creates non-expiring JWTs for legacy systems:
- Custom service name as issuer
- Never expires (no `exp` claim)
- Includes `type: "service-permanent"` claim
- **Use with extreme caution** - can only be revoked by changing INTERNAL_API_KEY

## Examples

### Quick JWT for Testing
```bash
npm run keygen
# Select option 1
# Copy the curl command to test the authenticated endpoint
```

### Generate New API Key for Environment
```bash
npm run keygen
# Select option 2 or 3
# Copy the INTERNAL_API_KEY=... line to your .env file
```

### Custom JWT with 5-minute expiry
```bash
npm run keygen
# Select option 4
# Enter issuer: my-service
# Enter expiry: 5
```

### Generate Service JWT for Microservice
```bash
npm run keygen
# Select option 5
# Enter service name: payment-service
# Enter validity: 365 (days)
```

### Generate Permanent JWT for Legacy System
```bash
npm run keygen
# Select option 6
# Enter service name: legacy-mainframe
# Confirm: yes
```

## Prerequisites

The TypeScript project must be built first:
```bash
npm run build
```

## Security Notes

- JWT tokens are signed with your `INTERNAL_API_KEY`
- Generated API keys are cryptographically secure random values
- Never commit API keys or tokens to version control
- **Token Security Levels**:
  - **Short-lived JWTs** (1 minute) - Highest security, auto-expire
  - **Service JWTs** (days/years) - Medium security, need rotation
  - **Permanent JWTs** - Lowest security, only revokable by changing INTERNAL_API_KEY

## Server-to-Server Communication

For microservices architecture:

1. Generate service JWTs with option 5 (recommended) or 6 (legacy only)
2. Store tokens in client service environment variables
3. Include in Authorization headers: `Bearer <token>`
4. Each service gets a unique token with identifiable `iss` claim
5. Rotate service tokens periodically for security

## Token Payload Examples

**Service JWT payload:**
```json
{
  "iss": "payment-service",
  "type": "service",
  "exp": 1756442826,
  "iat": 1753850826
}
```

**Permanent JWT payload:**
```json
{
  "iss": "legacy-system", 
  "type": "service-permanent",
  "iat": 1753850826
}
```