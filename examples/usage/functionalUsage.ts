/*
import express from 'express';

import { 
  createAuthContext,
  createMemoryStorage,
  generateTokenPair,
  refreshTokens,
  createAuthMiddleware,
  logoutDevice,
  AuthContext,
  DeviceInfo,
  verifyAccessToken
} from 'jwt-auth-manager';

const app = express();
app.use(express.json());

// Creating auth context
const storage = createMemoryStorage();
const authContext: AuthContext = createAuthContext(
  {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d' 
  },
  storage,
  {
    enableTokenRotation: true,
    enableConcurrentUsageDetection: true,
    enableDeviceFingerprinting: true
  }
);


// Helper function to extract device info
const extractDeviceInfo = (req: express.Request): DeviceInfo => ({
  fingerprint: req.headers['x-device-fingerprint'] as string,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

// Create auth middleware
const authenticateTokenMiddleware = createAuthMiddleware(authContext);

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    // Your user authentication logic here
    const user = { id: 1, email: 'user@example.com' };
    const deviceInfo = extractDeviceInfo(req);

    const tokens = await generateTokenPair(user, authContext, deviceInfo);
    
    res.json({
      message: 'Login successful',
      ...tokens
    });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Login failed' 
    });
  }
});

app.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const deviceInfo = extractDeviceInfo(req);

    const newTokens = await refreshTokens(refreshToken, authContext, deviceInfo);
    
    res.json(newTokens);
  } catch (error) {
    res.status(401).json({ 
      error: error instanceof Error ? error.message : 'Token refresh failed' 
    });
  }
});

// Protected route example
app.get('/profile', authenticateTokenMiddleware, (req: any, res) => {
  res.json({ user: req.user });
});

// Logout endpoint
app.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await logoutDevice(refreshToken, authContext);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Logout failed' 
    });
  }
});

// Advanced usage with error handling
const safeTokenRefresh = async (refreshToken: string, deviceInfo: DeviceInfo) => {
  try {
    return await refreshTokens(refreshToken, authContext, deviceInfo);
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

// Composable authentication flow
const authenticateAndRefresh = async (accessToken: string, refreshToken: string, deviceInfo: DeviceInfo) => {  
  const accessResult = verifyAccessToken(accessToken, authContext);
  
  if (accessResult.success) {
    return { tokens: { accessToken, refreshToken }, user: accessResult.data };
  }
  
  // Try to refresh
  const newTokens = await safeTokenRefresh(refreshToken, deviceInfo);
  if (newTokens) {
    const newAccessResult = verifyAccessToken(newTokens.accessToken, authContext);
    return { tokens: newTokens, user: newAccessResult.data };
  }
  
  throw new Error('Authentication failed');
};

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

*/
