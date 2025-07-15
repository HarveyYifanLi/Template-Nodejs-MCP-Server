import { MongoClient } from 'mongodb';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI; // your mongodb atlas URI

export function createListMongoTool() {
  return {
    name: 'listMongoDatabasesAndCollections',
    title: 'list mongodb databases and collections',
    description:
      'Lists all databases and collections in a MongoDB Atlas cluster',
    inputSchema: { connectToDb: z.boolean() },
    async execute({ connectToDb }) {
      if (!MONGO_URI) {
        throw new Error('🛑 MONGODB_URI environment variable is not set.');
      }

      const client = new MongoClient(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      if (connectToDb) {
        await client.connect();
      } else {
        return;
      }

      try {
        // List databases
        const adminDb = client.db().admin();

        const dbList = await adminDb.listDatabases();
        // use Promise.all for concurrent execution:
        const dbInfos = await Promise.all(
          dbList.databases.map(async ({ name: dbName }) => {
            const db = client.db(dbName);
            // console.log('********* dbName:', dbName);
            const collInfos = await db
              .listCollections({}, { nameOnly: true })
              .toArray();

            const collections = collInfos.map((info) => info.name);

            return { database: dbName, collections };
          })
        );
        // Converting results to final array
        const result = dbInfos;
        // console.log('********* result:', result);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } finally {
        await client.close();
      }
    },
  };
}

export function createFetchPokemonTool() {
  return {
    name: 'fetch-pokemon',
    title: 'Pokemon Fetcher',
    description: 'Get Pokemon data',
    inputSchema: { id: z.string() },
    async execute({ id }) {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);

      const data = await response.json();

      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      };
    },
  };
}
