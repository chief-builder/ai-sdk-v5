# PA Medicaid Benefits Assistant

A helpful assistant for Pennsylvania state (PA) Medicaid-related information including PACE, PACENET, LIFE programs, estate recovery, and eligibility requirements. Built with [Mastra](https://mastra.ai) and [AI SDK v5](https://sdk.vercel.ai/).

## Features

- **RAG-Powered Knowledge Base**: Vector search over PA Medicaid documents with relevance scoring
- **Real-time Streaming Chat**: AI SDK v5's `useChat` hook for smooth conversations
- **Source Citations**: Inline citations with expandable sources accordion
- **Senior-Friendly UI**: Large fonts (18-20px), high contrast, 44px+ touch targets
- **Persistent Memory**: Conversation history stored using LibSQL with Mastra Memory
- **Suggested Questions**: Quick-start cards for common queries
- **Copy & Retry Actions**: Easy message interaction buttons
- **Model Selector**: Choose between Mimo v2 Flash, Gemini Flash, or Claude Haiku

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **AI**: Mastra (agents, RAG, memory) + AI SDK v5 + OpenRouter
- **RAG**: LibSQL vector database + FastEmbed embeddings
- **Memory**: LibSQL persistent storage
- **Styling**: Tailwind CSS with senior-friendly theme
- **UI Components**: Radix UI + shadcn/ui

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
# Create a .env.local file
echo "OPENROUTER_API_KEY=your_key_here" > .env.local
```

3. Start the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) to see the chat interface

## Project Structure

```
app/
  api/chat/         # Streaming chat endpoint
  api/initial-chat/ # Load conversation history
  page.tsx          # Chat UI with AI Elements components
src/
  mastra/
    agents/         # RAG agent configuration
    tools/          # Vector search tool
    index.ts        # Mastra config
  components/
    ai-elements/    # Chat UI components (conversation, message, prompt-input, sources)
    ui/             # Base shadcn/ui components
data/
  rag_vectors.db    # Vector database with PA Medicaid documents
```

## Usage Examples

Ask the assistant questions about PA Medicaid programs:

- "What is PACE?"
- "Am I eligible for PACE?"
- "What benefits does PACE cover?"
- "What are the income limits for Medicaid?"
- "What happens to my house when I die?" (estate recovery)
- "How do I apply for Medicaid?"
- "What's the difference between PACE and PACENET?"

The assistant searches the knowledge base and provides answers with source citations.

## Knowledge Base

The RAG knowledge base includes:

- PA DHS (Department of Human Services) documents
- PACE/PACENET program guides
- Estate recovery FAQs
- Eligibility requirements
- Application procedures

Sources are displayed with relevance scores and can be expanded for reference.

## Development Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm mastra-dev   # Start Mastra dev server
```

## Issue Tracking

This project uses **bd (beads)** for issue tracking:

```bash
bd ready          # Find unblocked work
bd create "Title" # Create new issue
bd close <id>     # Complete work
bd sync           # Sync with git
```

## Learn More

- [Mastra Documentation](https://mastra.ai/docs) - Learn about Mastra's RAG and agent features
- [AI SDK Documentation](https://sdk.vercel.ai) - Explore AI SDK v5 features
- [OpenRouter](https://openrouter.ai) - Multi-model API provider
