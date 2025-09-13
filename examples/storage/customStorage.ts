/*
// Custom storage implementation for JWT tokens
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

export const createMongoDBStorage = (db: Db): TokenStorage => {
  const collection: Collection<MongoRefreshToken> = db.collection('RefreshTokens');
  
  // Create indexes for better performance
  const createIndexes = async () => {
    await collection.createIndex({ token: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
    await collection.createIndex({ isUsed: 1 });
  };

  // Initialize indexes
  createIndexes().catch(console.error);

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
      const doc = await collection.findOne({ token });
      
      if (!doc) return null;

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
      const now = new Date();
      await collection.deleteMany({ 
        expiresAt: { $lt: now } 
      });
    }
  };
};

// Advanced MongoDB Storage with additional features
export const createAdvancedMongoDBStorage = (db: Db): TokenStorage & {
  // Additional methods for advanced features
  getUserTokens: (userId: string | number) => Promise<RefreshTokenData[]>;
  getTokenStats: () => Promise<{ total: number; active: number; expired: number }>;
  revokeTokensByDevice: (deviceFingerprint: string) => Promise<number>;
  getTokensByIP: (ipAddress: string) => Promise<RefreshTokenData[]>;
} => {
  const collection: Collection<MongoRefreshToken> = db.collection('RefreshTokens');

  // Advanced indexes
  const createAdvancedIndexes = async () => {
    await collection.createIndex({ token: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ deviceFingerprint: 1 });
    await collection.createIndex({ ipAddress: 1 });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await collection.createIndex({ isUsed: 1, expiresAt: 1 });
    await collection.createIndex({ createdAt: -1 });
  };

  createAdvancedIndexes().catch(console.error);

  const baseStorage = createMongoDBStorage(db);

  return {
    ...baseStorage,

    // Get all tokens for a user
    async getUserTokens(userId: string | number): Promise<RefreshTokenData[]> {
      const docs = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      return docs.map(doc => ({
        id: doc._id!.toString(),
        userId: doc.userId,
        token: doc.token,
        deviceFingerprint: doc.deviceFingerprint,
        ipAddress: doc.ipAddress,
        userAgent: doc.userAgent,
        isUsed: doc.isUsed,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt
      }));
    },

    // Get token statistics
    async getTokenStats(): Promise<{ total: number; active: number; expired: number }> {
      const now = new Date();
      
      const [total, active, expired] = await Promise.all([
        collection.countDocuments(),
        collection.countDocuments({ 
          isUsed: false, 
          expiresAt: { $gt: now } 
        }),
        collection.countDocuments({ 
          expiresAt: { $lt: now } 
        })
      ]);

      return { total, active, expired };
    },

    // Revoke all tokens for a specific device
    async revokeTokensByDevice(deviceFingerprint: string): Promise<number> {
      const result = await collection.deleteMany({ deviceFingerprint });
      return result.deletedCount;
    },

    // Get tokens by IP address
    async getTokensByIP(ipAddress: string): Promise<RefreshTokenData[]> {
      const docs = await collection
        .find({ ipAddress })
        .sort({ createdAt: -1 })
        .toArray();

      return docs.map(doc => ({
        id: doc._id!.toString(),
        userId: doc.userId,
        token: doc.token,
        deviceFingerprint: doc.deviceFingerprint,
        ipAddress: doc.ipAddress,
        userAgent: doc.userAgent,
        isUsed: doc.isUsed,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt
      }));
    }
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
  const storage = createMongoDBStorage(db);
  
  return { client, db, storage };
};

*/
