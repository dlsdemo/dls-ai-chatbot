# dls-ai-chatbot

An experimental Retrieval Augmented Generation (RAG) AI on [Cloudflare Data Localization Suite (DLS)](https://developers.cloudflare.com/data-localization/).

## Tech Stack

- Cloudflare Wrangler
- Cloudflare Workers AI
- Cloudflare D1
- Cloudflare Vectorize
- LangChain JS

## Knowledge Base Data & Vector Store

The entire knowledge base data on Cloudflare Data Localization Suite (DLS) is stored in the [Cloudflare D1](https://developers.cloudflare.com/d1/) database `dls_data` across multiple tables.

The Model / Embeddings API used for the knowledge base data is `@cf/baai/bge-base-en-v1.5` with `768` output dimensions using distance metrics `cosine`.

> _Cosine similarity: Cosine similarity is a measure of the similarity between two vectors. It is calculated by taking the dot product of the two vectors and dividing by the product of their norms. Cosine similarity is a good choice for semantic text retrieval because it is insensitive to the order of the terms in the vectors. This means that it can be used to compare documents that are written in different ways, but that have the same meaning._

_Source: [Vector DB Architecture for a custom documents chatbot](https://medium.com/@puneetthegde22/vector-db-architecture-for-a-custom-documents-chatbot-fbaab9e28089)_

Visit [dls-ai.dlsdemo.com/vector-store](https://dls-ai.dlsdemo.com/vector-store) to retrieve the configuration of the [Vectorize](https://developers.cloudflare.com/vectorize/) Vector Store, including its configured `dimensions` and `distance metric`.

## Embedding Model

The Generative Text Model / Embedding Model used is `@cf/meta/llama-2-7b-chat-fp16`.

Review [available Embedding Models](https://developers.cloudflare.com/workers-ai/models/text-generation/#available-embedding-models).

## Usage

Visit [dls-ai.dlsdemo.com](https://dls-ai.dlsdemo.com/) and add your question to the `?query=` parameter:

```
https://dls-ai.dlsdemo.com/?query=Which%20regions%20does%20Regional%20Services%20support%3F
```

Recommended use is through the UI [ai.dlsdemo.com](https://ai.dlsdemo.com/).

### Knowledge Base

By running the `/demo` endpoint, the Workers queries a D1 database to data to the Vectorize Vector Store: our Knowledge Base.

In order to clear / delete the entire Knowledge Base (Vectorize Vector Store), simply run the `/clear` endpoint.

### Paths

Retrieve the Vector Store details:
```
/vector-store
```

Run a Vector Search `similaritySearchWithScore` for similar documents in the knowledge base:
```
/vector-search?query=what%20is%20regional%20services?
```

Get streaming responses:
```
/streaming?query=what%20is%20regional%20services?
```

## Development

When inside the working directory, install all dependencies:
```
npm install
```

Run a local server for developing:
```
npx wrangler dev --remote
```

Deploy the project:
```
npx wrangler deploy
```

## Future Updates

Keep the package and models up2date by periodically reviewing the [DevDocs](https://developers.cloudflare.com/workers-ai/) and running:

```
npm update @cloudflare/ai --save-dev
```

# Disclaimer

For educational purposes only.

This is an experimental project using [Retrieval Augmented Generation (RAG) AI](https://developers.cloudflare.com/workers-ai/tutorials/build-a-retrieval-augmented-generation-ai/) on Cloudflare Workers AI. It is not intended for production use. Use at your own risk. Beware of hallucinations.

The answers provided by this RAG AI are often incorrect, incomplete, or lacking in context.
