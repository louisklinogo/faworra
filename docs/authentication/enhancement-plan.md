# Authentication Enhancement Plan

## Overview
Transform the basic Supabase JWT authentication into a comprehensive multi-layered system similar to Midday's approach, implementing it in phases to maintain system stability.

## Current vs Target Architecture

### **Current System** 📊
- **Basic Supabase JWT** authentication only
- **Simple team-based middleware** with basic checks
- **MFA support** but minimal flow handling
- **Basic redirect handling** for authentication states
- **Limited error handling** and no analytics

### **Target System** 🏆 (Inspired by Midday)
- **Multi-layered authentication** with 4 token types
- **OAuth 2.0 server** for third-party integrations
- **Comprehensive middleware stack** with different security levels
- **Advanced security features** (CSRF, PKCE, rate limiting, token hashing)
- **MFA support** with proper flow handling
- **Detailed analytics** and error tracking

## Phase-by-Phase Implementation Plan

### **Phase 1: Enhanced Security Foundation** 🛡️
**Goal:** Strengthen existing auth with rate limiting and better error handling  
**Duration:** 2-3 days  
**Dependencies:** None

#### 1.1 Rate Limiting Middleware
```typescript
// packages/api/src/middleware/rate-limiter.ts
export interface RateLimitOptions {
  windowMs: number;
  limit: number;
  keyGenerator: (c: Context) => string;
  statusCode?: number;
  message?: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  return async (c: Context, next: Next) => {
    const key = options.keyGenerator(c);
    const limit = await checkRateLimit(key, options);
    
    if (limit.exceeded) {
      throw new HTTPException(options.statusCode || 429, { 
        message: options.message || "Rate limit exceeded" 
      });
    }
    
    c.set("rateLimit", {
      remaining: limit.remaining,
      resetTime: limit.resetTime,
    });
    
    await next();
  };
};
```

#### 1.2 Enhanced Auth Callback
```typescript
// apps/admin/src/app/auth/callback/route.ts (enhanced)
import { trackAuthEvent } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const provider = requestUrl.searchParams.get("provider");

  try {
    if (code) {
      const supabase = await createServerClient();

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        // Enhanced error tracking
        await trackAuthEvent({
          event: "SignIn.Failed",
          provider,
          error: error.message,
          errorCode: error?.status,
        });

        const status = error?.status || "unknown";
        const reason = encodeURIComponent(error?.message || "unknown_error");
        console.error("Auth callback error:", { status, message: error?.message });
        
        return NextResponse.redirect(
          new URL(`/login?error=auth_failed&status=${status}&reason=${reason}`, requestUrl.origin)
        );
      }

      // Get user and track successful sign-in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Track sign-in analytics
        await trackAuthEvent({
          event: "SignIn.Success",
          provider,
          userId: user.id,
          userEmail: user.email,
        });

        // ... existing team setup logic ...
      }
    }

    // Remember provider preference
    if (provider) {
      (await cookies()).set(CookiePreferredSignInProvider, provider, { 
        maxAge: 60 * 60 * 24 * 365 
      });
    }

    return NextResponse.redirect(new URL("/", requestUrl.origin));
    
  } catch (error) {
    // Comprehensive error handling
    console.error("Unexpected auth callback error:", error);
    
    await trackAuthEvent({
      event: "SignIn.Failed",
      provider,
      error: error instanceof Error ? error.message : "Unknown error",
      errorType: "unexpected",
    });

    return NextResponse.redirect(
      new URL("/login?error=unexpected_error", requestUrl.origin)
    );
  }
}
```

#### 1.3 Analytics Tracking Service
```typescript
// packages/analytics/src/auth-events.ts
export interface AuthEvent {
  event: "SignIn.Success" | "SignIn.Failed" | "SignOut" | "TokenRefresh";
  provider?: string;
  userId?: string;
  userEmail?: string;
  error?: string;
  errorCode?: string | number;
  errorType?: string;
  timestamp?: Date;
}

export async function trackAuthEvent(event: AuthEvent) {
  try {
    // Log to console for now, later integrate with analytics service
    console.log("Auth Event:", {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });
    
    // TODO: Integrate with OpenPanel like Midday
    // Example OpenPanel integration:
    // const client = new OpenPanel({
    //   clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!,
    //   clientSecret: process.env.OPENPANEL_SECRET_KEY!,
    // });
    // await client.track(event.event, eventData);
    
  } catch (error) {
    console.error("Failed to track auth event:", error);
  }
}
```

### **Phase 2: API Key Authentication System** 🔑
**Goal:** Enable programmatic access with API keys  
**Duration:** 3-4 days  
**Dependencies:** Phase 1

#### 2.1 API Key Generation Service
```typescript
// packages/auth/src/api-keys.ts
import crypto from "crypto";
import bcrypt from "bcryptjs";

export interface ApiKey {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  token: string; // Only returned during creation
  hashedToken: string;
  scopes: string[];
  lastUsedAt?: Date;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

export class ApiKeyService {
  async generateApiKey(params: {
    teamId: string;
    userId: string;
    name: string;
    scopes: string[];
    expiresInDays?: number;
  }): Promise<ApiKey> {
    const { teamId, userId, name, scopes, expiresInDays = 365 } = params;
    
    // Generate secure token
    const randomBytes = crypto.randomBytes(32);
    const key = `faw_api_${randomBytes.toString('base64url')}`;
    
    // Hash token for storage
    const hashedToken = await bcrypt.hash(key, 12);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    const apiKey = await createApiKeyInDb({
      teamId,
      userId,
      name,
      hashedToken,
      scopes,
      expiresAt,
    });
    
    return {
      ...apiKey,
      token: key, // Only return plaintext token once
    };
  }
  
  async validateApiKey(token: string): Promise<ApiKey | null> {
    if (!token.startsWith("faw_api_")) {
      return null;
    }
    
    // Check cache first
    const cached = await this.getFromCache(token);
    if (cached) return cached;
    
    // Get all non-revoked, non-expired API keys
    const apiKeys = await getActiveApiKeys();
    
    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(token, apiKey.hashedToken);
      if (isValid) {
        // Update last used timestamp
        await updateApiKeyLastUsed(apiKey.id);
        
        // Cache result
        await this.setCache(token, apiKey);
        
        return apiKey;
      }
    }
    
    return null;
  }
}
```

#### 2.2 Enhanced Auth Middleware
```typescript
// apps/api/src/rest/middleware/auth.ts (enhanced)
import type { MiddlewareHandler } from "hono";
import type { ApiEnv } from "../../types/hono-env";
import { createClient, createAdminClient } from "../../services/supabase";
import { ApiKeyService } from "@Faworra/auth/api-keys";

const apiKeyService = new ApiKeyService();

export interface AuthSession {
  userId: string;
  teamId: string;
  user: {
    id: string;
    email?: string;
    full_name?: string;
  };
  type: "jwt" | "api_key" | "oauth_token";
  scopes?: string[];
}

export const requireAuthTeam: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const authHeader = c.req.header("authorization") || c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
  
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let session: AuthSession;

  // Handle API Keys (faw_api_*)
  if (token.startsWith("faw_api_")) {
    const apiKey = await apiKeyService.validateApiKey(token);
    if (!apiKey || apiKey.revoked || new Date() > apiKey.expiresAt) {
      return c.json({ error: "Invalid or expired API key" }, 401);
    }
    
    session = {
      userId: apiKey.userId,
      teamId: apiKey.teamId,
      user: {
        id: apiKey.userId,
        email: apiKey.user?.email,
        full_name: apiKey.user?.fullName,
      },
      type: "api_key",
      scopes: apiKey.scopes,
    };
  } 
  // Handle JWT tokens (existing logic)
  else {
    const supabase = createClient();
    const admin = createAdminClient();

    const { data: userRes, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userRes?.user) {
      return c.json({ error: "Invalid token" }, 401);
    }
    
    const userId = userRes.user.id;

    const { data: uRow, error: uErr } = await admin
      .from("users")
      .select("current_team_id")
      .eq("id", userId)
      .maybeSingle<{ current_team_id: string | null }>();
      
    if (uErr) return c.json({ error: uErr.message }, 500);
    
    const teamId = uRow?.current_team_id || null;
    if (!teamId) return c.json({ error: "No team selected" }, 403);

    session = {
      userId,
      teamId,
      user: {
        id: userId,
        email: userRes.user.email,
        full_name: userRes.user.user_metadata?.full_name,
      },
      type: "jwt",
    };
  }

  // Set context
  c.set("userId", session.userId);
  c.set("teamId", session.teamId);
  c.set("session", session);
  c.set("supabaseAdmin", createAdminClient());
  
  return next();
};

// Scope validation middleware
export const requireScopes = (requiredScopes: string[]): MiddlewareHandler<ApiEnv> => {
  return async (c, next) => {
    const session = c.get("session") as AuthSession;
    
    // JWT tokens have full access
    if (session.type === "jwt") {
      return next();
    }
    
    // Check if API key has required scopes
    if (session.type === "api_key") {
      const userScopes = session.scopes || [];
      const hasAllScopes = requiredScopes.every(scope => userScopes.includes(scope));
      
      if (!hasAllScopes) {
        return c.json({ 
          error: "Insufficient permissions",
          required: requiredScopes,
          granted: userScopes,
        }, 403);
      }
    }
    
    return next();
  };
};
```

### **Phase 3: Database Schema Extensions** 🗄️
**Goal:** Add required tables for advanced auth features  
**Duration:** 1-2 days  
**Dependencies:** Phase 2

#### 3.1 API Keys Migration
```sql
-- Migration: 001_create_api_keys_table.sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hashed_token TEXT UNIQUE NOT NULL,
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_keys_hashed_token ON api_keys(hashed_token) WHERE revoked = FALSE;
CREATE INDEX idx_api_keys_team_id ON api_keys(team_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE revoked = FALSE;

-- RLS policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their team's API keys" ON api_keys
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM users_on_team WHERE user_id = auth.uid()
    )
  );
```

#### 3.2 OAuth Applications Migration
```sql
-- Migration: 002_create_oauth_applications_table.sql
CREATE TABLE oauth_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT NOT NULL,
  redirect_uris TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  scopes TEXT[] DEFAULT ARRAY['read:basic']::TEXT[],
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Access Tokens
CREATE TABLE oauth_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES oauth_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  hashed_token TEXT UNIQUE NOT NULL,
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Phase 4-7: Advanced Features**

**Phase 4:** Comprehensive Middleware Stack  
**Phase 5:** OAuth 2.0 Server Implementation  
**Phase 6:** Advanced Security Features (CSRF, PKCE, Redis)  
**Phase 7:** Testing & Documentation  

## Implementation Timeline

| Phase | Duration | Dependencies | Key Deliverables |
|-------|----------|--------------|------------------|
| **Phase 1** | 2-3 days | None | Rate limiting, enhanced error handling, basic analytics |
| **Phase 2** | 3-4 days | Phase 1 | API key generation, validation, middleware integration |
| **Phase 3** | 1-2 days | Phase 2 | Database schema, migrations, RLS policies |
| **Phase 4** | 2-3 days | Phase 3 | Layered middleware, scope validation, admin checks |
| **Phase 5** | 4-5 days | Phase 4 | OAuth 2.0 server, authorization/token endpoints |
| **Phase 6** | 3-4 days | Phase 5 | PKCE, token hashing, advanced rate limiting |
| **Phase 7** | 2-3 days | All phases | Comprehensive tests, documentation |

**Total Estimated Time:** 3-4 weeks

## Key Benefits After Implementation

✅ **Multi-token authentication** (JWT + API keys + OAuth)  
✅ **Enterprise-grade security** (rate limiting, CSRF, PKCE)  
✅ **Third-party integrations** (OAuth 2.0 server)  
✅ **Comprehensive analytics** (auth event tracking)  
✅ **Scalable middleware** (layered security approach)  
✅ **Production-ready** (error handling, monitoring)  
✅ **Scope-based permissions** (fine-grained access control)  
✅ **Token management** (generation, validation, revocation)

## Security Considerations

- **Token Storage**: All tokens stored as bcrypt hashes
- **Rate Limiting**: Multiple tiers based on endpoint sensitivity  
- **CSRF Protection**: State parameter validation (min 32 chars)
- **PKCE Support**: Code challenge verification for OAuth
- **Scope Validation**: Fine-grained permission checking
- **Audit Logging**: Comprehensive auth event tracking
- **Secure Defaults**: Fail-secure approach throughout

## Rollback Strategy

Each phase is designed to be independently deployable with rollback capabilities:

1. **Feature Flags**: All new auth methods behind feature flags
2. **Backward Compatibility**: Existing JWT auth continues to work
3. **Database Migrations**: All migrations are reversible  
4. **Gradual Rollout**: New features can be enabled per team
5. **Monitoring**: Comprehensive logging for issue detection

Ready to begin implementation! 🚀