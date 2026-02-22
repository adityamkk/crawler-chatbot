import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "http://localhost:6333" });

async function init() {
  await client.createCollection("webpages", {
    vectors: {
      size: 768, // nomic-embed-text dimension
      distance: "Cosine",
    },
  });

  console.log("Collection created");
}

init();