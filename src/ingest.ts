import axios from "axios";

async function embed(text: string): Promise<number[]> {
  const response = await axios.post("http://localhost:11434/api/embeddings", {
    model: "nomic-embed-text",
    prompt: text,
  });

  return response.data.embedding;
}

import { QdrantClient } from "@qdrant/js-client-rest";

const qdrant = new QdrantClient({
  url: "http://localhost:6333",
});


import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});


import { CheerioCrawler } from "crawlee";
import crypto from "crypto";

const crawler = new CheerioCrawler({
  maxRequestsPerMinute: 60,
  requestHandlerTimeoutSecs: 60,
  ignoreSslErrors: true,
  async requestHandler({ request, $, enqueueLinks }) {
    console.log("Processing:", request.url);

    const text = $("body").text();

    if (!text || text.length < 300) return;

    const chunks = await splitter.splitText(text);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i] as string;

      const embedding = await embed(chunk);

      const sha256Hex = crypto
        .createHash("sha256")
        .update(request.url + i)
        .digest("hex");

      // Take first 32 hex chars (16 bytes = 128 bits)
      const hashPart = sha256Hex.substring(0, 32);

      const id = [
      hashPart.substring(0, 8),
      hashPart.substring(8, 12),
      hashPart.substring(12, 16),
      hashPart.substring(16, 20),
      hashPart.substring(20, 32)
      ].join('-');

      try {
        await qdrant.upsert("webpages", {
            points: [
            {
                id,
                vector: embedding,
                payload: {
                url: request.url,
                text: chunk,
                chunkIndex: i,
                crawlDate: new Date().toISOString(),
                },
            },
            ],
        });
      } catch (err: any) {
        console.error("Qdrant upsert error:");
        console.error(err.response?.data || err);
      }
    }

    await enqueueLinks({
      strategy: "same-domain",
    });

    console.log("Finished processing url");
  },
  preNavigationHooks: [
    async (crawlingContext, requestOptions) => {
      requestOptions.headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
      };
    },
  ],
});

await crawler.run(["https://www.anydb.com"]);
console.log("Ingestion complete.");
