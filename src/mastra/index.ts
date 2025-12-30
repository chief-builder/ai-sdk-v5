// import { Mastra } from "@mastra/core";
// import { PinoLogger } from "@mastra/loggers";

// import { weatherAgent } from "./agents/weather_index";

// export const mastra = new Mastra({
//   agents: { weatherAgent },
//   logger: new PinoLogger({
//     name: "Mastra",
//     level: "info",
//   }),
// });



import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability } from '@mastra/observability';
import { ragAgent } from './agents/rag-agent';
import { vectorStore } from './tools/vector-search-tool';

export const mastra = new Mastra({
  agents: { ragAgent },
  vectors: { libsql: vectorStore },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: "file:/Users/chiefbuilder/Documents/Projects/ai-sdk-v5/state/mastra.db",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    // Enables DefaultExporter and CloudExporter for tracing
    default: { enabled: true },
  }),
});
