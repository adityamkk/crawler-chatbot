import axios from 'axios';

export const PORT = 3000;
export const DB: string = "webpages";

export async function embed(text: string): Promise<number[]> {
  const response = await axios.post(`${process.env.OLLAMA_URL as string}/api/embeddings`, {
    model: "nomic-embed-text",
    prompt: text,
  });

  return response.data.embedding;
}