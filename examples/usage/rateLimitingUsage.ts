/*
import express from 'express';
import { 
  createRateLimitContext,
  createMemoryRateLimitStorage,
  createRateLimitPipeline,
  checkRateLimit,
  recordAttempt,
  unlockUser,
  unlockIP,
  getRateLimitStatus
} from './rateLimiting';

const app = express();

// Create rate limit context
const storage = createMemoryRateLimitStorage();
const rateLimitContext = createRateLimitContext({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 60 * 60 * 1000, // 1 hour
  bruteForce: {
    enabled: true,
    maxFailedAttempts: 10,
    lockoutDurationMs: 60 * 60 * 1000 // 1 hour
  },
  alerts: {
    enabled: true,
    threshold: 3,
    webhook: 'https://hooks.slack.com/...'
  }
}, storage);

// Apply rate limiting pipeline
const rateLimitPipeline = createRateLimitPipeline(rateLimitContext);
app.use(...rateLimitPipeline);

// Auth routes
app.post('/login', async (req, res) => {
  // Your login logic here
  // Success/failure will be automatically recorded
});

// Manual rate limiting check
app.post('/manual-check', async (req, res) => {
  const result = await checkRateLimit(req.ip, rateLimitContext, req.body.userId);
  
  if (!result.allowed) {
    return res.status(429).json(result);
  }
  
  // Process request
  const success = true; // Your logic here
  await recordAttempt(req.ip, rateLimitContext, success, req.body.userId);
  
  res.json({ message: 'Success' });
});

// Admin management routes
app.post('/admin/unlock-user/:userId', async (req, res) => {
  await unlockUser(req.params.userId, rateLimitContext);
  res.json({ message: 'User unlocked' });
});

app.post('/admin/unlock-ip/:ip', async (req, res) => {
  await unlockIP(req.params.ip, rateLimitContext);
  res.json({ message: 'IP unlocked' });
});

app.get('/admin/rate-limit-status/:identifier', async (req, res) => {
  const status = await getRateLimitStatus(req.params.identifier, rateLimitContext);
  res.json(status);
});

// Functional composition example
const rateLimitAndProcess = async (identifier: string, userId: string) => {
  const checkResult = await checkRateLimit(identifier, rateLimitContext, userId);
  
  if (!checkResult.allowed) {
    throw new Error(checkResult.reason || 'Rate limited');
  }
  
  // Process your business logic
  const processResult = await yourBusinessLogic();
  
  // Record the attempt
  await recordAttempt(identifier, rateLimitContext, processResult.success, userId);
  
  return processResult;
};

*/
