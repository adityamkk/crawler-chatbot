import { embed } from './shared.js'
import { QdrantClient } from "@qdrant/js-client-rest";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { CheerioCrawler } from "crawlee";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL as string }); //`http://localhost:${QDRANT_PORT}`

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const crawler = new CheerioCrawler({
  maxConcurrency: 10,
  maxRequestsPerMinute: 60,
  maxRequestRetries: 2,
  requestHandlerTimeoutSecs: 10,
  ignoreSslErrors: true,
  async requestHandler({ request, $, enqueueLinks }) {
    console.log("Processing:", request.url);
    // TODO: Parallelize this request handler
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

// Load config
const configPath = path.join(path.dirname(process.cwd()), "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

await crawler.run(config.sites);
console.log("Ingestion complete, exiting process.");
process.exit(0); // force container to exit after ingestion
