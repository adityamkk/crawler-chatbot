import express from 'express';
import { Ollama } from 'ollama';
import { QdrantClient } from "@qdrant/js-client-rest";
import { PORT, DB, embed } from './shared.js'

const ollama = new Ollama({ host: process.env.OLLAMA_URL as string }); //`http://localhost:${OLLAMA_PORT}`
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL as string }); //`http://localhost:${QDRANT_PORT}`
const app = express();

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const embedding = await embed(userMessage);
  const results = await qdrant.search(DB, {
    vector: embedding,
    limit: 3,
  });

  const contextChunks = results.map(r => ({
    text: r.payload?.text,
    url: r.payload?.url,
    score: r.score
  }));

  const contextText = contextChunks
    .map((chunk, i) => {
      return `Source ${i + 1} (${chunk.url}):
  ${chunk.text}`;
    })
    .join("\n\n---\n\n");

  function buildPrompt(query: string, context: string) {
      return `
    You are a helpful assistant.
    Answer the user's question using ONLY the provided context.

    If the answer is not in the context, say:
    "I could not find this information in the provided documents."

    Always cite sources using (Source X).

    Context:
    ---------------------
    ${context}
    ---------------------

    Question:
    ${query}

    Answer:
    `;
  }

  try {
    const response = await ollama.chat({
      model: 'llama3',
      messages: [
        { role: 'system', content: "You are a helpful assistant."},
        { role: 'user', content: buildPrompt(userMessage, contextText) }
      ],
    });
    res.json({ response: response.message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing your request.' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
