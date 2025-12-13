# Implementing Midday's Infrastructure Stack

Based on the analysis of Midday's codebase, here's what they actually use and how to implement the same stack:

## 📊 Analytics: OpenPanel (Not PostHog/Mixpanel)

### What Midday Uses
- **OpenPanel**: Privacy-first analytics service
- **Consent-based tracking**: Users opt-in for analytics
- **Server + Client integration**: Both server-side and client-side tracking
- **Event types**: Sign-ins, exports, screen views, outgoing links

### Implementation Steps

#### 1. Install OpenPanel
```bash
bun add @openpanel/nextjs
```

#### 2. Environment Variables
```bash
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=your_client_id
OPENPANEL_SECRET_KEY=your_secret_key
```

#### 3. Server-side Analytics (`packages/analytics/src/openpanel-server.ts`)
```typescript
import OpenPanel from "@openpanel/nextjs";
import { cookies } from "next/headers";

export const setupAnalytics = async (options?: { userId?: string; fullName?: string }) => {
  const { userId, fullName } = options ?? {};
  
  // Check tracking consent (like Midday)
  const trackingConsent = (await cookies()).get("tracking-consent")?.value === "1";
  
  const client = new OpenPanel({
    clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
    clientSecret: process.env.OPENPANEL_SECRET_KEY!,
  });

  // Identify user if consent given
  if (trackingConsent && userId && fullName) {
    const [firstName, lastName] = fullName.split(" ");
    await client.identify({
      profileId: userId,
      firstName,
      lastName,
    });
  }

  return {
    track: async (options: { event: string; [key: string]: any }) => {
      if (trackingConsent) {
        const { event, ...properties } = options;
        await client.track(event, properties);
      }
    },
  };
};
```

#### 4. Client-side Component (`packages/analytics/src/openpanel-provider.tsx`)
```typescript
import { OpenPanelComponent } from "@openpanel/nextjs";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === "production";
  
  return (
    <>
      <OpenPanelComponent
        clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
        trackAttributes={true}
        trackScreenViews={isProd}
        trackOutgoingLinks={isProd}
      />
      {children}
    </>
  );
}
```

#### 5. Update Auth Events Service
```typescript
// packages/analytics/src/auth-events.ts
import { setupAnalytics } from "./openpanel-server";

export async function trackAuthEvent(event: AuthEvent) {
  try {
    console.log("🔐 Auth Event:", JSON.stringify(eventData, null, 2));
    
    // Use OpenPanel like Midday
    const analytics = await setupAnalytics({
      userId: event.userId,
      fullName: event.metadata?.fullName,
    });
    
    await analytics.track({
      event: event.event,
      provider: event.provider,
      errorType: event.errorType,
      ...event.metadata,
    });
    
  } catch (error) {
    console.error("Failed to track auth event:", error);
  }
}
```

## ⚡ Caching: Redis Implementation

### What Midday Uses
- **Full Redis setup** with connection pooling
- **Multiple cache types**: API keys, users, teams, permissions
- **Read-after-write consistency** for database replication
- **Distributed caching** across server instances

### Implementation Steps

#### 1. Install Redis Client
```bash
bun add redis
```

#### 2. Environment Variable
```bash
REDIS_URL=redis://localhost:6379
```

#### 3. Redis Client (`packages/cache/src/redis-client.ts`)
```typescript
import { createClient, RedisClientType } from "redis";

export class RedisCache {
  private redis: RedisClientType | null = null;
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string, defaultTTL: number = 30 * 60) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private async getRedisClient(): Promise<RedisClientType> {
    if (!this.redis || !this.redis.isReady) {
      this.redis = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 15000,
          // IPv6 for production (Fly.io) like Midday
          family: process.env.NODE_ENV === "production" ? 6 : 4,
        },
      });

      // Error handling
      this.redis.on("error", (err) => {
        console.error("Redis error:", err);
        this.redis = null;
      });

      // Keep-alive ping every 4 minutes (like Midday)
      setInterval(() => {
        if (this.redis?.isReady) {
          this.redis.ping().catch(() => {
            this.redis = null;
          });
        }
      }, 4 * 60 * 1000);

      await this.redis.connect();
    }

    return this.redis;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await this.getRedisClient();
      const value = await redis.get(`${this.prefix}:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const redis = await this.getRedisClient();
      await redis.setEx(
        `${this.prefix}:${key}`,
        ttl ?? this.defaultTTL,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const redis = await this.getRedisClient();
      await redis.del(`${this.prefix}:${key}`);
    } catch (error) {
      console.error("Redis delete error:", error);
    }
  }
}
```

#### 4. API Key Cache (`packages/cache/src/api-key-cache.ts`)
```typescript
import { RedisCache } from "./redis-client";

const cache = new RedisCache("api-key", 30 * 60); // 30 min TTL like Midday

export const apiKeyCache = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: any) => cache.set(key, value),
  delete: (key: string) => cache.delete(key),
};
```

#### 5. Enhanced Rate Limiter with Redis
```typescript
// packages/api/src/middleware/rate-limiter-redis.ts
import { RedisCache } from "@faworra/cache/redis-client";

const rateLimitCache = new RedisCache("rate-limit", 15 * 60); // 15 min TTL

export const redisRateLimiter = (options: RateLimitOptions) => {
  return async (c: Context, next: Next) => {
    const key = options.keyGenerator(c);
    const window = Math.floor(Date.now() / options.windowMs);
    const redisKey = `${key}:${window}`;

    try {
      let current = await rateLimitCache.get<number>(redisKey) || 0;
      current++;
      
      await rateLimitCache.set(redisKey, current, Math.ceil(options.windowMs / 1000));

      if (current > options.limit) {
        const retryAfter = Math.ceil(options.windowMs / 1000);
        c.header("Retry-After", retryAfter.toString());
        
        throw new HTTPException(429, {
          message: "Rate limit exceeded",
        });
      }

      c.set("rateLimit", {
        limit: options.limit,
        current,
        remaining: Math.max(0, options.limit - current),
        resetTime: (window + 1) * options.windowMs,
      });

      await next();
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      
      console.error("Rate limiter error:", error);
      // Fail open if Redis is down
      await next();
    }
  };
};
```

## 🔄 Migration Path

### Phase 1: Keep Current (In-Memory)
- ✅ Current implementation works for single instance
- ✅ No external dependencies
- ✅ Good for development and testing

### Phase 2: Add OpenPanel Analytics
```bash
# Install OpenPanel
bun add @openpanel/nextjs

# Update analytics service
# Add tracking consent UI
# Update auth callback to use OpenPanel
```

### Phase 3: Add Redis Caching  
```bash
# Install Redis
bun add redis

# Set up Redis client
# Migrate rate limiter to Redis
# Add API key caching (for Phase 2)
```

### Phase 4: Full Distributed Setup
- Redis for all caching
- Read-after-write consistency
- Connection pooling
- IPv6 support for production

## 📊 Comparison: Your Current vs Midday

| Feature | Your Current | Midday | Recommendation |
|---------|--------------|--------|----------------|
| **Analytics** | Console logs | OpenPanel | Migrate to OpenPanel |
| **Rate Limiting** | In-memory | Redis | Start in-memory, migrate to Redis |
| **Caching** | None | Redis (5 types) | Add Redis for API keys first |
| **Privacy** | None | Consent-based | Add tracking consent |
| **Deployment** | Single instance | Multi-instance | Redis when scaling |

## 🎯 Recommended Implementation Order

1. **Keep Phase 1** as-is (works great for now)
2. **Add OpenPanel** when you want analytics
3. **Add Redis** when you need multiple server instances
4. **Add privacy controls** when you have users

Your current implementation is solid! Midday's additional infrastructure is mainly for scale and compliance, not core functionality.

## Environment Variables Summary

```bash
# Analytics (Optional - Phase 2)
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=your_client_id
OPENPANEL_SECRET_KEY=your_secret_key

# Caching (Optional - Phase 3)
REDIS_URL=redis://localhost:6379

# Privacy (Optional - Phase 4)  
# Handled through UI/cookie consent
```

The beauty of this approach is **you can adopt each piece incrementally** as you scale, just like Midday likely did!