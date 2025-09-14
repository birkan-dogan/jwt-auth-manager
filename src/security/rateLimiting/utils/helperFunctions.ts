import { RateLimitContext } from "../../../types/security/rateLimiting";

// Pure utility functions
const isWhitelisted = (ip: string, whitelist: string[]): boolean =>
  whitelist.includes(ip);

const isBlacklisted = (ip: string, blacklist: string[]): boolean =>
  blacklist.includes(ip);

const isWindowExpired = (firstAttempt: Date, windowMs: number): boolean =>
  Date.now() - firstAttempt.getTime() > windowMs;

const isBlocked = (blockedUntil?: Date): boolean =>
  blockedUntil ? blockedUntil > new Date() : false;

const calculateRetryAfter = (blockedUntil: Date): number =>
  blockedUntil.getTime() - Date.now();

const calculateRemainingAttempts = (current: number, max: number): number =>
  Math.max(0, max - current - 1);

const sendAlert = async (
  identifier: string,
  attempts: number,
  context: RateLimitContext
): Promise<void> => {
  const { options } = context;

  if (!options.alerts.enabled || attempts < options.alerts.threshold) {
    return;
  }

  const alertData = {
    identifier,
    attempts,
    timestamp: new Date().toISOString(),
    message: `Rate limit exceeded: ${attempts} attempts from ${identifier}`,
  };

  // Send webhook alert
  if (options.alerts.webhook) {
    try {
      await fetch(options.alerts.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertData),
      });
    } catch (error) {
      console.error("Failed to send webhook alert:", error);
    }
  }

  // Log alert (email sending would require additional service)
  if (options.alerts.email) {
    console.warn(
      `SECURITY ALERT: ${alertData.message} (notify: ${options.alerts.email})`
    );
  }
};

export {
  isWhitelisted,
  isBlacklisted,
  isWindowExpired,
  isBlocked,
  calculateRetryAfter,
  calculateRemainingAttempts,
  sendAlert,
};
