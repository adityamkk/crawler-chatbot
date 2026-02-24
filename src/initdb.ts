import { QdrantClient } from "@qdrant/js-client-rest";
import { DB } from './shared.js';

const client = new QdrantClient({ url: process.env.QDRANT_URL as string });

async function init() {
  try {
    // Fetch existing collections
    const collections = await client.getCollections();
    const collectionNames = collections.collections.map(c => c.name);

    if (collectionNames.includes(DB)) {
      console.log(`Collection "${DB}" already exists. Skipping creation.`);
    } else {
      // Create collection if it doesn't exist
      await client.createCollection(DB, {
        vectors: {
          size: 768, // nomic-embed-text dimension
          distance: "Cosine",
        },
      });
      console.log(`Collection "${DB}" created successfully.`);
    }
  } catch (err) {
    console.error("Error initializing Qdrant collection:", err);
  }
}

init();