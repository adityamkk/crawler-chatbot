import { QdrantClient } from "@qdrant/js-client-rest";
import { DB } from './shared.js'

const client = new QdrantClient({ url: process.env.QDRANT_URL as string });

async function deleteDB() {
  await client.deleteCollection(DB);

  console.log("Collection deleted");
}

deleteDB();