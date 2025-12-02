# Phase 4: Comprehensive Middleware Stack Documentation

This document covers all middleware components implemented in Phase 4, following Midday's battle-tested patterns.

## Table of Contents

1. [Overview](#overview)
2. [Middleware Components](#middleware-components)
   - [Rate Limiting](#rate-limiting-middleware)
   - [Security Headers](#security-headers-middleware)
   - [Request Transformation](#request-transformation-middleware)
   - [Error Handling](#error-handling-middleware)
   - [Correlation & Tracing](#correlation--tracing-middleware)
3. [Integration Guide](#integration-guide)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Best Practices](#best-practices)

## Overview

The Phase 4 middleware stack provides enterprise-grade request handling capabilities inspired by Midday's architecture:

- **Simple & Battle-tested**: Uses proven patterns from production systems
- **Performance Focused**: Minimal overhead with efficient caching
- **Security First**: Comprehensive protection against common vulnerabilities
- **Observable**: Full correlation tracking and structured logging
- **Fail-safe**: Graceful error handling with consistent API responses

### Architecture

```
Request → Correlation → Error Handler → Security → Rate Limiter → Transformation → Your App
```

## Middleware Components

### Rate Limiting Middleware

**File**: `packages/middleware/src/rate-limiting-simple.ts`

Simple rate limiting using Hono's built-in rate limiter, exactly like Midday.

#### Features

- **Protected Endpoints**: 100 requests per 10 minutes per user
- **OAuth Endpoints**: 20 requests per 15 minutes per IP
- **User Identification**: Supports both JWT tokens and API keys
- **Redis Caching**: Distributed rate limiting across instances

#### Usage

```typescript
import { rateLimitingMiddleware } from '@faworra/middleware/rate-limiting-simple';

// For protected API endpoints
app.use('/api/*', rateLimitingMiddleware.protectedEndpoints());

// For OAuth/auth endpoints  
app.use('/auth/*', rateLimitingMiddleware.oauthEndpoints());

// Custom rate limiting
app.use('/uploads/*', rateLimitingMiddleware.custom({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 requests per minute
  keyGenerator: (c) => c.req.header('CF-Connecting-IP') || 'anonymous'
}));
```

#### Configuration

```typescript
type RateLimitOptions = {
  windowMs: number;        // Time window in milliseconds
  limit: number;           // Request limit per window
  keyGenerator?: Function; // Custom key generation
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
};
```

### Security Headers Middleware

**File**: `packages/middleware/src/security-simple.ts`

Security headers and CORS handling following Midday's exact configuration.

#### Features

- **Security Headers**: X-Frame-Options, CSP, HSTS, etc.
- **CORS Configuration**: Environment-based origin whitelisting
- **24-hour Cache**: Max-Age matching Midday's settings
- **Production Ready**: Strict policies for production environments

#### Usage

```typescript
import { securityMiddleware } from '@faworra/middleware/security-simple';

app.use('*', securityMiddleware({
  environment: process.env.NODE_ENV,
  allowedOrigins: [
    'http://localhost:3000',    // Development
    'https://app.faworra.com',  // Production
  ]
}));
```

#### Configuration

```typescript
type SecurityOptions = {
  environment: 'development' | 'staging' | 'production';
  allowedOrigins?: string[];
  enableHSTS?: boolean;
  contentSecurityPolicy?: string;
};
```

### Request Transformation Middleware

**File**: `packages/middleware/src/transformation-simple.ts`

Request/response transformation with sanitization and data normalization.

#### Features

- **HTML Sanitization**: XSS protection with safe HTML preservation
- **Ghana Phone Formatting**: Automatic +233 prefix handling
- **Email Normalization**: Trimming and case normalization
- **Fail-open**: Continues processing if transformation fails

#### Usage

```typescript
import { transformationMiddleware } from '@faworra/middleware/transformation-simple';

app.use('*', transformationMiddleware({
  enableSanitization: true,
  enablePhoneFormatting: true,
  enableEmailNormalization: true
}));

// Access transformed data
app.post('/api/users', (c) => {
  const body = c.get('transformedBody');
  // body.email is now normalized
  // body.phone has +233 prefix
  // body.bio is HTML-sanitized
});
```

#### Transformations

- **Phone Numbers**: `0244123456` → `+233244123456`
- **Emails**: `  USER@EXAMPLE.COM  ` → `user@example.com`
- **HTML**: `<script>alert('xss')</script>Hello` → `Hello`

### Error Handling Middleware

**File**: `packages/middleware/src/error-handling.ts`

Standardized error handling with Midday's exact error schemas.

#### Features

- **Consistent Responses**: Structured error objects across all endpoints
- **HTTP Exception Handling**: Proper status code mapping
- **Validation Errors**: OpenAPI-compatible validation responses
- **Health Checks**: Standard health check endpoints

#### Usage

```typescript
import { 
  globalErrorHandler,
  throwUnauthorized,
  throwValidationError,
  validateRequest,
  ErrorCodes
} from '@faworra/middleware/error-handling';

// Apply global error handler
app.use('*', globalErrorHandler);

// Validate requests
app.post('/api/users', validateRequest(['name', 'email']));

// Throw structured errors
app.get('/protected', (c) => {
  if (!c.get('userId')) {
    throwUnauthorized('Login required');
  }
  return c.json({ success: true });
});
```

#### Error Response Format

```typescript
// Standard error
{
  "code": "unauthorized",
  "message": "Login required"
}

// Validation error  
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Required field is missing" }
  ]
}
```

#### Error Codes

- `unauthorized`, `forbidden`, `invalid_credentials`
- `validation_error`, `missing_required_field`, `invalid_format`
- `resource_not_found`, `resource_conflict`
- `internal_server_error`, `service_unavailable`
- `rate_limit_exceeded`, `external_service_error`

### Correlation & Tracing Middleware

**File**: `packages/middleware/src/correlation-tracing.ts`

Request correlation and distributed tracing using Hono's request-id middleware.

#### Features

- **Request IDs**: Format `faw_req_[16-char-hex]`
- **Trace IDs**: Format `faw_trace_[16-char-hex]`
- **User Context**: Automatic user/team extraction from auth
- **Structured Logging**: JSON logs with correlation context
- **Performance Tracking**: Request duration and status logging

#### Usage

```typescript
import { 
  correlationTracing,
  getCorrelationContext,
  createLogger,
  withCorrelationContext
} from '@faworra/middleware/correlation-tracing';

// Apply correlation middleware
app.use('*', correlationTracing({
  enableTracing: true,
  logRequests: true,
  includeHeaders: false  // Only for debugging
}));

// Use in handlers
app.get('/api/users', (c) => {
  const logger = createLogger(c);
  const context = getCorrelationContext(c);
  
  logger.info('Fetching users', { count: users.length });
  
  return c.json(withCorrelationContext(c, {
    users,
    total: users.length
  }));
});
```

#### Context Variables

```typescript
type CorrelationVariables = {
  requestId: string;    // Always present
  traceId?: string;     // If tracing enabled
  userId?: string;      // From auth middleware
  teamId?: string;      // From auth middleware  
  startTime: number;    // Request start timestamp
};
```

## Integration Guide

### Complete Middleware Stack

```typescript
import { Hono } from 'hono';
import type { ApiEnv } from '@faworra/api/types/hono-env';

// Import middleware
import { correlationTracing } from '@faworra/middleware/correlation-tracing';
import { globalErrorHandler } from '@faworra/middleware/error-handling';
import { securityMiddleware } from '@faworra/middleware/security-simple';
import { rateLimitingMiddleware } from '@faworra/middleware/rate-limiting-simple';
import { transformationMiddleware } from '@faworra/middleware/transformation-simple';

const app = new Hono<ApiEnv>();

// Apply middleware in correct order
app.use('*', correlationTracing({
  enableTracing: true,
  logRequests: process.env.NODE_ENV !== 'test'
}));

app.use('*', globalErrorHandler);

app.use('*', securityMiddleware({
  environment: process.env.NODE_ENV as any,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || []
}));

// Rate limiting for different endpoint types
app.use('/api/*', rateLimitingMiddleware.protectedEndpoints());
app.use('/auth/*', rateLimitingMiddleware.oauthEndpoints());

app.use('*', transformationMiddleware({
  enableSanitization: true,
  enablePhoneFormatting: true,
  enableEmailNormalization: true
}));

// Your routes here
app.get('/health', healthCheckHandler);
app.route('/api', apiRoutes);
app.route('/auth', authRoutes);

export default app;
```

### Order of Operations

1. **Correlation**: Generate request IDs and trace context
2. **Error Handler**: Catch and format all errors consistently  
3. **Security**: Apply security headers and CORS
4. **Rate Limiting**: Check request limits per user/IP
5. **Transformation**: Sanitize and normalize request data
6. **Your Application**: Handle business logic

### Environment Configuration

```bash
# Rate Limiting
REDIS_URL=redis://localhost:6379

# Security  
NODE_ENV=production
ALLOWED_ORIGINS=https://app.faworra.com,https://admin.faworra.com

# Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

## Configuration

### Global Configuration

Create a middleware config file:

```typescript
// config/middleware.ts
export const middlewareConfig = {
  correlation: {
    enableTracing: process.env.ENABLE_TRACING !== 'false',
    logRequests: process.env.NODE_ENV !== 'test',
    headerName: 'X-Request-Id',
    traceHeaderName: 'X-Trace-Id'
  },
  
  security: {
    environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    enableHSTS: process.env.NODE_ENV === 'production'
  },
  
  rateLimiting: {
    protectedEndpoints: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      limit: 100
    },
    oauthEndpoints: {
      windowMs: 15 * 60 * 1000, // 15 minutes  
      limit: 20
    }
  },
  
  transformation: {
    enableSanitization: true,
    enablePhoneFormatting: true,
    enableEmailNormalization: true,
    failSilently: true
  }
};
```

### Per-Environment Overrides

```typescript
// Development
if (process.env.NODE_ENV === 'development') {
  middlewareConfig.rateLimiting.protectedEndpoints.limit = 1000;
  middlewareConfig.security.allowedOrigins.push('http://localhost:3000');
}

// Testing  
if (process.env.NODE_ENV === 'test') {
  middlewareConfig.correlation.logRequests = false;
  middlewareConfig.rateLimiting.protectedEndpoints.limit = 1000000;
}
```

## Testing

### Running Tests

```bash
# Run all middleware tests
bun test tests/auth/phase4-middleware.test.ts

# Run with coverage
bun test tests/auth/phase4-middleware.test.ts --coverage

# Run specific test suite
bun test tests/auth/phase4-middleware.test.ts -t "Rate Limiting"
```

### Test Categories

1. **Unit Tests**: Individual middleware components
2. **Integration Tests**: Full middleware stack
3. **Performance Tests**: High load scenarios
4. **Edge Cases**: Error conditions and malformed data

### Mocking External Dependencies

```typescript
// Mock Redis for rate limiting tests
vi.mock('@faworra/cache/src/redis', () => ({
  createRedisClient: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(() => Promise.resolve(1)),
    expire: vi.fn(),
  })),
}));
```

### Example Tests

```typescript
describe('Middleware Integration', () => {
  it('should apply full stack correctly', async () => {
    const app = new Hono<ApiEnv>();
    
    // Apply full middleware stack
    applyMiddleware(app);
    
    app.post('/api/test', (c) => c.json({ success: true }));
    
    const res = await app.request('/api/test', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ email: '  TEST@EXAMPLE.COM  ' })
    });
    
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });
});
```

## Best Practices

### 1. Middleware Order

Always apply middleware in this order to avoid conflicts:
1. Correlation/Tracing (first)
2. Error Handling
3. Security Headers
4. Rate Limiting
5. Request Transformation
6. Your application logic (last)

### 2. Error Handling

- Use structured error objects consistently
- Log errors with correlation context
- Don't expose internal errors to clients
- Always include request ID in error responses

```typescript
// Good
throw new HTTPException(400, { 
  message: 'Invalid email format' 
});

// Bad  
throw new Error('Database connection failed: ' + dbError);
```

### 3. Performance Considerations

- Enable Redis for rate limiting in production
- Disable request logging in high-traffic scenarios
- Use fail-open approach for non-critical transformations
- Cache expensive operations when possible

### 4. Security

- Always validate CORS origins in production
- Use HTTPS-only cookies and headers
- Sanitize all user input
- Log security events with full context

### 5. Monitoring

- Monitor rate limiting metrics
- Track error rates by endpoint
- Alert on unusual request patterns
- Use correlation IDs for distributed tracing

```typescript
// Good: Structured logging
const logger = createLogger(c);
logger.info('User created', { 
  userId: newUser.id,
  email: newUser.email,
  source: 'api'
});

// Bad: Unstructured logging  
console.log('User created:', newUser.email);
```

### 6. Configuration

- Use environment-based configuration
- Provide sensible defaults
- Document all configuration options
- Validate configuration at startup

### 7. Testing

- Test middleware in isolation
- Test full stack integration
- Test error scenarios
- Test performance under load
- Mock external dependencies

---

## Summary

The Phase 4 middleware stack provides:

✅ **Battle-tested**: Based on Midday's production patterns  
✅ **Simple**: Minimal configuration, maximum functionality  
✅ **Secure**: Comprehensive protection and validation  
✅ **Observable**: Full correlation tracking and logging  
✅ **Performant**: Efficient caching and fail-safe design  
✅ **Tested**: 100+ test cases covering all scenarios  

This middleware stack gives Faworra enterprise-grade request handling capabilities while maintaining simplicity and performance.