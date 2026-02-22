import express from 'express';
import { Ollama } from 'ollama';

const OLLAMA_PORT = 11434;
const QDRANT_PORT = 6333;
const ollama = new Ollama({ host: `http://localhost:${OLLAMA_PORT}` });
const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  try {
    const response = await ollama.chat({
      model: 'llama3',
      messages: [{ role: 'user', content: userMessage }],
    });
    res.json({ response: response.message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing your request.' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
