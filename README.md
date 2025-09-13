# 🔐 JWT Auth Manager

> **Functional TypeScript JWT authentication library with refresh token support**

A production-ready, type-safe JWT authentication system with advanced security features like token rotation, concurrent usage detection, and device fingerprinting.

[![npm version](https://badge.fury.io/js/%birkan-dogan%2Fjwt-auth-manager.svg)](https://badge.fury.io/js/%birkan-dogan%2Fjwt-auth-manager)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🔒 **Secure by Default**: Token rotation, concurrent usage detection
- 🎯 **Functional Design**: Pure functions, immutable operations
- 📘 **Full TypeScript**: Complete type safety and IntelliSense support
- 🔌 **Flexible Storage**: Use any database with the storage interface
- 🚀 **Production Ready**: Built-in security features and error handling
- 🎨 **Express.js Integration**: Ready-to-use middleware
- 📱 **Device Tracking**: Optional device fingerprinting support
- 🧪 **Test Friendly**: Easy to test with dependency injection

---

## 📦 Installation

```bash
npm install @birkan-dogan/jwt-auth-manager
```

**Required dependencies:**

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

---

## 🚀 Quick Start

### 1. Basic Setup

```typescript
import {
  createAuthContext,
  createMemoryStorage,
  generateTokenPair,
  refreshTokens,
  createAuthMiddleware,
} from "@birkan-dogan/jwt-auth-manager";

// Create storage (use createMemoryStorage for development)
const storage = createMemoryStorage();

// Create auth context
const authContext = createAuthContext(
  {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
  },
  storage
);
```

### 2. Generate Tokens

```typescript
const user = { id: "user123", email: "user@example.com" };

// Generate tokens
const tokens = await generateTokenPair(user, authContext);
console.log(tokens);
// { accessToken: "eyJhbGc...", refreshToken: "eyJhbGc..." }
```

### 3. Refresh Tokens

```typescript
// Refresh expired tokens
const newTokens = await refreshTokens(tokens.refreshToken, authContext);
console.log(newTokens);
// { accessToken: "new_token...", refreshToken: "new_refresh..." }
```

### 4. Express.js Middleware

```typescript
import express from "express";

const app = express();
const authenticateToken = createAuthMiddleware(authContext);

// Protected route
app.get("/profile", authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});
```

---

## 🔧 Advanced Configuration

### Security Options

```typescript
const authContext = createAuthContext(
  {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    accessTokenExpiry: "15m", // or 900 (seconds)
    refreshTokenExpiry: "7d", // or 604800 (seconds)
  },
  storage,
  {
    enableTokenRotation: true, // Rotate tokens on refresh
    enableConcurrentUsageDetection: true, // Detect token reuse
    enableDeviceFingerprinting: false, // Track devices
    enableLocationTracking: false, // Track IP/location
    maxConcurrentTokens: 5, // Max tokens per user
  }
);
```

### Device Fingerprinting

```typescript
const deviceInfo = {
  fingerprint: req.headers["x-device-fingerprint"] as string,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
};

// Generate tokens with device info
const tokens = await generateTokenPair(user, authContext, deviceInfo);

// Refresh with device verification
const newTokens = await refreshTokens(
  tokens.refreshToken,
  authContext,
  deviceInfo
);
```

---

## 🗄️ Storage Adapters

The library uses a storage interface that you can implement for any database.

### Built-in Memory Storage

```typescript
import { createMemoryStorage } from "@birkan-dogan/jwt-auth-manager";

const storage = createMemoryStorage();
// Perfect for development and testing
```

### Custom Storage Implementation

```typescript
import { TokenStorage, RefreshTokenData } from "@birkan-dogan/jwt-auth-manager";

const createCustomStorage = (): TokenStorage => ({
  async saveRefreshToken(data: Omit<RefreshTokenData, "id">): Promise<string> {
    // Save to your database
    return "token_id";
  },

  async getRefreshToken(token: string): Promise<RefreshTokenData | null> {
    // Fetch from your database
    return null;
  },

  async invalidateRefreshToken(token: string): Promise<void> {
    // Delete from your database
  },

  async invalidateAllUserTokens(userId: string | number): Promise<void> {
    // Delete all user tokens
  },

  async markTokenAsUsed(token: string): Promise<void> {
    // Mark token as used (for concurrent usage detection)
  },

  async cleanupExpiredTokens(): Promise<void> {
    // Clean up expired tokens
  },
});
```

---

## 📚 Storage Examples

We provide complete storage implementations in the `examples` folder:

### MongoDB Example

```typescript
// Copy from examples/mongodbStorage.ts
import { createMongoDBStorage } from "./examples/mongodbStorage";
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();
const db = client.db("auth_app");
const storage = createMongoDBStorage(db);
```

### PostgreSQL Example

```typescript
// Copy from examples/postgresStorage.ts
import { createPostgreSQLStorage } from "./examples/postgresStorage";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const storage = createPostgreSQLStorage(pool);
```

### Redis Example

```typescript
// Copy from examples/redisStorage.ts
import { createRedisStorage } from "./examples/redisStorage";
import { createClient } from "redis";

const client = createClient();
await client.connect();
const storage = createRedisStorage(client);
```

---

## 🛡️ Security Features

### Token Rotation

Every refresh operation generates new access and refresh tokens, invalidating the old ones.

```typescript
// Old refresh token becomes invalid after use
const newTokens = await refreshTokens(oldRefreshToken, authContext);
// oldRefreshToken is now blacklisted
```

### Concurrent Usage Detection

If the same refresh token is used multiple times, all user tokens are invalidated.

```typescript
// First usage - OK
const tokens1 = await refreshTokens(refreshToken, authContext);

// Second usage of same token - Security violation!
// All user tokens will be invalidated
try {
  const tokens2 = await refreshTokens(refreshToken, authContext);
} catch (error) {
  console.log(error.message); // "Concurrent token usage detected"
}
```

### Device Fingerprinting

Tokens can be tied to specific devices using fingerprints.

```typescript
const deviceInfo = { fingerprint: "unique_device_id" };
const tokens = await generateTokenPair(user, authContext, deviceInfo);

// This will fail if used from a different device
await refreshTokens(tokens.refreshToken, authContext, {
  fingerprint: "different_device",
});
```

---

## 🔌 Complete Express.js Example

```typescript
import express from "express";
import {
  createAuthContext,
  createMemoryStorage,
  generateTokenPair,
  refreshTokens,
  createAuthMiddleware,
  logoutUser,
  logoutDevice,
} from "@birkan-dogan/jwt-auth-manager";

const app = express();
app.use(express.json());

// Setup auth context
const storage = createMemoryStorage();
const authContext = createAuthContext(
  {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
  },
  storage,
  {
    enableTokenRotation: true,
    enableConcurrentUsageDetection: true,
    enableDeviceFingerprinting: true,
  }
);

// Middleware
const authenticateToken = createAuthMiddleware(authContext);

// Helper function
const extractDeviceInfo = (req: express.Request) => ({
  fingerprint: req.headers["x-device-fingerprint"] as string,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

// Routes
app.post("/login", async (req, res) => {
  try {
    // Your user authentication logic here
    const user = await authenticateUser(req.body.email, req.body.password);
    const deviceInfo = extractDeviceInfo(req);

    const tokens = await generateTokenPair(user, authContext, deviceInfo);

    res.json({
      message: "Login successful",
      ...tokens,
    });
  } catch (error) {
    res.status(401).json({
      error: error instanceof Error ? error.message : "Authentication failed",
    });
  }
});

app.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const deviceInfo = extractDeviceInfo(req);

    const newTokens = await refreshTokens(
      refreshToken,
      authContext,
      deviceInfo
    );

    res.json(newTokens);
  } catch (error) {
    res.status(401).json({
      error: error instanceof Error ? error.message : "Token refresh failed",
    });
  }
});

app.get("/profile", authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

app.post("/logout", async (req, res) => {
  try {
    const { refreshToken, logoutAll } = req.body;

    if (logoutAll) {
      // Logout from all devices
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      );
      await logoutUser(decoded.userId, authContext);
    } else {
      // Logout from current device only
      await logoutDevice(refreshToken, authContext);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Logout failed",
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
```

---

## 🔍 API Reference

### Core Functions

#### `createAuthContext(config, storage, securityOptions?)`

Creates the authentication context with configuration and storage.

#### `generateTokenPair(user, authContext, deviceInfo?)`

Generates access and refresh token pair for a user.

#### `refreshTokens(refreshToken, authContext, deviceInfo?)`

Refreshes expired access token using refresh token.

#### `verifyAccessToken(token, authContext)`

Verifies and decodes access token.

#### `logoutUser(userId, authContext)`

Invalidates all tokens for a specific user.

#### `logoutDevice(refreshToken, authContext)`

Invalidates specific refresh token (single device logout).

### Middleware

#### `createAuthMiddleware(authContext)`

Creates Express.js middleware for protecting routes.

### Storage

#### `createMemoryStorage()`

Creates in-memory storage for development/testing.

---

## 🧪 Testing

The functional design makes testing straightforward:

```typescript
import {
  createAuthContext,
  createMemoryStorage,
  generateTokenPair,
  verifyAccessToken,
} from "@birkan-dogan/jwt-auth-manager";

describe("JWT Auth Manager", () => {
  const storage = createMemoryStorage();
  const authContext = createAuthContext(
    {
      accessTokenSecret: "test-secret",
      refreshTokenSecret: "test-refresh-secret",
    },
    storage
  );

  it("should generate valid tokens", async () => {
    const user = { id: "test-user", email: "test@example.com" };
    const tokens = await generateTokenPair(user, authContext);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const result = verifyAccessToken(tokens.accessToken, authContext);
    expect(result.success).toBe(true);
    expect(result.data.userId).toBe("test-user");
  });
});
```

---

## 🛠️ Environment Variables

```bash
# Required
ACCESS_TOKEN_SECRET=your-super-secret-access-key-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32-chars

# Optional
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

**⚠️ Security Note**: Use strong, unique secrets (minimum 32 characters) and store them securely.

---

## 🔒 Security Best Practices

1. **Strong Secrets**: Use cryptographically strong secrets (32+ characters)
2. **HTTPS Only**: Always use HTTPS in production
3. **Secure Storage**: Store refresh tokens securely (httpOnly cookies recommended)
4. **Short Access Token Lifetime**: Keep access tokens short-lived (15-30 minutes)
5. **Token Rotation**: Always enable token rotation in production
6. **Rate Limiting**: Implement rate limiting on auth endpoints
7. **Monitoring**: Monitor for suspicious authentication patterns

---

## 📈 Performance Tips

1. **Database Indexing**: Index token, userId, and expiresAt fields
2. **Connection Pooling**: Use connection pooling for database storage
3. **TTL Indexes**: Use TTL indexes for automatic token cleanup (MongoDB)
4. **Caching**: Consider Redis for high-performance token storage
5. **Cleanup Jobs**: Regularly clean up expired tokens

---

## 🐛 Troubleshooting

### Common Issues

**TypeScript errors with jwt.sign():**

```bash
npm install @types/jsonwebtoken@latest
```

**"Invalid refresh token" errors:**

- Check if token rotation is causing conflicts
- Verify refresh token hasn't been used before (concurrent usage detection)
- Ensure refresh token hasn't expired

**Memory storage losing data:**

- Memory storage is cleared on app restart
- Use persistent storage (MongoDB, PostgreSQL, etc.) for production

---

## 📋 Migration Guide

### From v0.x to v1.0

The library was rewritten with functional approach:

```typescript
// Old (v0.x)
const jwtManager = new JWTManager(config, storage, options);
await jwtManager.generateTokens(user);

// New (v1.0)
const authContext = createAuthContext(config, storage, options);
await generateTokenPair(user, authContext);
```

**Breaking Changes:**

- `JWTManager` class removed → Use `createAuthContext()` + functions
- `generateTokens()` → `generateTokenPair()`
- `refreshToken()` → `refreshTokens()`
- All functions are now pure and take `authContext` as parameter

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/birkan-dogan/jwt-auth-manager.git
cd jwt-auth-manager

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Project Structure

```
src/
├── core/                   # Core authentication functions
│   ├── tokenGeneration.ts
│   ├── tokenVerification.ts
│   ├── tokenRefresh.ts
│   └── tokenInvalidation.ts
├── middleware/             # Express.js middleware
│   └── authMiddleware.ts
├── storage/                # Storage implementations
│   └── memoryStorage.ts
├── utils/                  # Utility functions
│   └── helpers.ts
├── types/                  # TypeScript type definitions
│   └── index.ts
└── index.ts               # Main exports

examples/                   # Database storage examples
├── mongodbStorage.ts
├── postgresStorage.ts
├── redisStorage.ts
└── README.md
```

---

## 📝 Changelog

### v1.0.0 (Latest)

- 🎉 Initial release with functional architecture
- ✨ Token rotation and concurrent usage detection
- 🔒 Device fingerprinting support
- 📘 Full TypeScript support
- 🔌 Express.js middleware
- 🗃️ Flexible storage interface
- 📚 Complete documentation and examples

---

## 🙋‍♂️ FAQ

### Q: Can I use this with frameworks other than Express.js?

**A:** Yes! The core functions are framework-agnostic. Only the middleware is Express-specific, but you can easily create similar middleware for other frameworks.

### Q: How do I handle token refresh on the frontend?

**A:** Here's a React example with Axios interceptors:

```typescript
import axios from "axios";

// Response interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post("/refresh", { refreshToken });

        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // Retry original request
        return axios.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

### Q: What's the difference between access and refresh tokens?

**A:**

- **Access Token**: Short-lived (15-30 min), used for API requests
- **Refresh Token**: Long-lived (7-30 days), used only to get new access tokens

### Q: How do I implement "Remember Me" functionality?

**A:** Use longer refresh token expiry:

```typescript
const authContext = createAuthContext(
  {
    // ... other config
    refreshTokenExpiry: rememberMe ? "30d" : "7d",
  },
  storage
);
```

### Q: Can I customize token payload?

**A:** Yes, modify the `generateTokenPair` function or extend it:

```typescript
const generateCustomTokenPair = async (
  user: User,
  authContext: AuthContext,
  customData: any
) => {
  // Add custom data to user object
  const extendedUser = { ...user, ...customData };
  return generateTokenPair(extendedUser, authContext);
};
```

### Q: How do I handle multiple concurrent requests during token refresh?

**A:** Implement request queuing:

```typescript
let refreshPromise: Promise<any> | null = null;

const refreshTokens = async () => {
  if (!refreshPromise) {
    refreshPromise = axios.post("/refresh", { refreshToken });
    const response = await refreshPromise;
    refreshPromise = null;
    return response;
  }
  return refreshPromise;
};
```

---

## 🔗 Related Projects

- [Passport.js](http://www.passportjs.org/) - Authentication middleware for Node.js
- [Auth0](https://auth0.com/) - Identity platform for developers
- [Firebase Auth](https://firebase.google.com/products/auth) - Google's authentication solution
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js

---

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Support

- ⭐ **Star this repo** if you find it helpful
- 🐛 **Report bugs** via [GitHub Issues](https://github.com/birkan-dogan/jwt-auth-manager/issues)
- 💬 **Ask questions** in [GitHub Discussions](https://github.com/birkan-dogan/jwt-auth-manager/discussions)
- 📧 **Email**: birkandogandev@gmail.com

---

## 🚀 Roadmap

- [ ] Built-in rate limiting support
- [ ] WebSocket authentication support
- [ ] OAuth2 integration helpers
- [ ] Multi-tenant support
- [ ] Token blacklisting with Redis
- [ ] Audit logging capabilities
- [ ] GraphQL middleware support
- [ ] React hooks package
- [ ] Vue.js composables package
- [ ] CLI tool for key generation

---

<div align="center">

[Documentation](https://birkan-dogan.github.io/jwt-auth-manager) • [Examples](examples/) • [Contributing](CONTRIBUTING.md) • [Changelog](CHANGELOG.md)

</div>
