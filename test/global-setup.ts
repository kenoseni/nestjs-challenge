import { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function globalSetup() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { storageEngine: 'wiredTiger', count: 1 },
  });

  (global as any).__MONGOD__ = replSet;

  process.env.MONGO_URI = replSet.getUri();
  console.log(
    'Global setup: Using in-memory MongoDB URI:',
    process.env.MONGO_URI,
  );
}
