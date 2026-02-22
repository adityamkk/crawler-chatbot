import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "http://localhost:6333" });

async function deleteDB() {
  await client.deleteCollection("webpages");

  console.log("Collection deleted");
}

deleteDB();