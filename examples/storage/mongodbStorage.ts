/*
// MongoDB storage implementation with enhanced cleanup strategies

import { MongoClient, Db, Collection } from 'mongodb';
import { TokenStorage, RefreshTokenData } from 'jwt-auth-manager';

export interface MongoRefreshToken {
  _id?: string;
  userId: string | number;
  token: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  isUsed: boolean;
  createdAt: Date;
  expiresAt: Date;
}

// Enhanced MongoDB Storage with custom cleanup intervals
export const createMongoDBStorageWithCleanup = (
  db: Db,
  cleanupIntervalSeconds: number = 10
): TokenStorage & {
  startCleanup: () => void;
  stopCleanup: () => void;
  forceCleanup: () => Promise<number>;
} => {
  const collection: Collection<MongoRefreshToken> = db.collection('RefreshTokens');
  let cleanupInterval: NodeJS.Timeout | null = null;
  
  // Create indexes (TTL as backup + performance indexes)
  const createIndexes = async () => {
    await collection.createIndex({ token: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 3600 }); // 1 hour backup TTL
    await collection.createIndex({ isUsed: 1 });
  };

  createIndexes().catch(console.error);

  // Manual cleanup function
  const performCleanup = async (): Promise<number> => {
    try {
      const now = new Date();
      const result = await collection.deleteMany({ 
        expiresAt: { $lt: now } 
      });
      
      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} expired tokens`);
      }
      
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Token cleanup error:', error);
      return 0;
    }
  };

  // Start cleanup interval
  const startCleanup = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
    
    cleanupInterval = setInterval(performCleanup, cleanupIntervalSeconds * 1000);
    console.log(`🚀 Token cleanup started (every ${cleanupIntervalSeconds} seconds)`);
  };

  // Stop cleanup interval
  const stopCleanup = () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
      console.log('⏹️ Token cleanup stopped');
    }
  };

  // Auto-start cleanup
  startCleanup();

  return {
    async saveRefreshToken(data: Omit<RefreshTokenData, 'id'>): Promise<string> {
      const mongoDoc: MongoRefreshToken = {
        userId: data.userId,
        token: data.token,
        deviceFingerprint: data.deviceFingerprint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        isUsed: data.isUsed,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt
      };

      const result = await collection.insertOne(mongoDoc);
      return result.insertedId.toString();
    },

    async getRefreshToken(token: string): Promise<RefreshTokenData | null> {
      // Cleanup check on read (lazy cleanup)
      if (Math.random() < 0.1) { // 10% chance
        performCleanup().catch(console.error);
      }

      const doc = await collection.findOne({ token });
      
      if (!doc) return null;

      // Check if token is expired (real-time check)
      if (doc.expiresAt < new Date()) {
        // Delete immediately and return null
        collection.deleteOne({ token }).catch(console.error);
        return null;
      }

      return {
        id: doc._id!.toString(),
        userId: doc.userId,
        token: doc.token,
        deviceFingerprint: doc.deviceFingerprint,
        ipAddress: doc.ipAddress,
        userAgent: doc.userAgent,
        isUsed: doc.isUsed,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt
      };
    },

    async invalidateRefreshToken(token: string): Promise<void> {
      await collection.deleteOne({ token });
    },

    async invalidateAllUserTokens(userId: string | number): Promise<void> {
      await collection.deleteMany({ userId });
    },

    async markTokenAsUsed(token: string): Promise<void> {
      await collection.updateOne(
        { token },
        { 
          $set: { 
            isUsed: true,
            usedAt: new Date()
          } 
        }
      );
    },

    async cleanupExpiredTokens(): Promise<void> {
      await performCleanup();
    },

    // Additional methods
    startCleanup,
    stopCleanup,
    forceCleanup: performCleanup
  };
};

// Usage example with MongoDB connection
export const createMongoDBConnection = async (
  connectionString: string,
  databaseName: string
) => {
  const client = new MongoClient(connectionString);
  await client.connect();
  
  const db = client.db(databaseName);
  const storage = createMongoDBStorageWithCleanup(db);
  
  return { client, db, storage };
};

// Complete usage example
/*
import { 
  createAuthContext, 
  generateTokenPair, 
  refreshTokens 
} from 'jwt-auth-manager';

const main = async () => {
  // Connect to MongoDB
  const { client, db, storage } = await createMongoDBConnection(
    'mongodb://localhost:27017',
    'auth_app'
  );

  // Create auth context
  const authContext = createAuthContext(
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

  // Generate tokens
  const user = { id: 'user123', email: 'user@example.com' };
  const deviceInfo = {
    fingerprint: 'device123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  };

  const tokens = await generateTokenPair(user, authContext, deviceInfo);
  console.log('Generated tokens:', tokens);

  // Refresh tokens
  const newTokens = await refreshTokens(tokens.refreshToken, authContext, deviceInfo);
  console.log('Refreshed tokens:', newTokens);

  // Clean up
  await client.close();
};

*/
