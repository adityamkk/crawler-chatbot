# Crawling Chatbot

A locally runnable, fully open source chatbot backend that crawls admin specified websites to use as context.

## Prerequisites

You need to have ~5 GB of space available, as well as Docker.
Running the project will instantiate multiple long running processes on your machine, which you can end at anytime by terminating the docker compose.
Some containers will pull certain docker images from the internet, such as an ollama image and a qdrant image.

## Installation

Clone the repository with 
```
git clone https://www.github.com/adityamkk/crawler-chatbot
```

To install dependencies, navigate to the root directory of the project and run
```
npm install
```

To configure which sites you want to crawl, list them in `config.json`.
To start all services, run 
```
npm run dev
```

If you are setting up these services for the first time on your machine, you will need to perform the following steps:
- Run `npm run dev`
- In another shell/terminal in the same directory, run `docker exec -it ollama sh`
- Within the docker subshell, run `ollama pull nomic-embed-text` and `ollama pull llama3`
    - Pulling llama3 will take several minutes, but this is expected
- Type `exit`, then press Enter to exit the subshell.
- Press Ctrl + C to stop the `npm run dev` command
- Finally, rerun `npm run dev`

## Methodology

There are several components that work together to power the enhanced-context chatbot. 
1. The Web Crawler (Cheerio)
    - The crawler retrieves webpages, parses them, and stores them in a database for future reference.
    - The crawler then looks for related webpages and continues.
2. The Vector Database (Qdrant)
    - The vector database stores embeddings of webpages found by the crawler.
    - The database provides a way to access the top N related webpages to a given user query.
3. The LLM (llama3)
    - The LLM takes as input user queries and context from the database, and outputs a helpful response.
4. The Server
    - The server has a single clean endpoint, to ask the LLM a query.
    - The LLM's output is sent back to the user.