import { ipcMain } from 'hadron-ipc';
import OpenAI from 'openai';
import type { AgentConfig, CommandRisk } from './stores/store';
import { classifyCommand } from './services/ai-service';

function buildSystemPrompt(
  dbName: string,
  collections: string[],
  schemaSamples: Record<string, unknown>
): string {
  return `You are an expert MongoDB database assistant embedded inside MongoDB Compass.
You help users interact with their database by generating valid mongosh shell commands.

CURRENT DATABASE: ${dbName}
AVAILABLE COLLECTIONS: ${collections.join(', ')}

SCHEMA SAMPLES (one document per collection):
${JSON.stringify(schemaSamples, null, 2)}

RULES:
1. Always respond with VALID mongosh commands that can be executed directly.
2. Your response MUST be valid JSON with exactly these fields:
   - "explanation": A brief human-readable explanation of what the command does.
   - "command": The exact mongosh command string to execute.
3. Use the correct database and collection names from the context above.
4. For read operations, prefer .find() with proper filters and projections.
5. For aggregations, use .aggregate() with proper pipeline stages.
6. Always use the collection names exactly as they appear above.
7. If the user's request is ambiguous, make a reasonable assumption and explain it.
8. NEVER include destructive operations unless explicitly asked by the user.
9. Do NOT wrap the command in markdown code fences — return raw mongosh code.
10. NEVER include "use <database>;" in your command. Assume the execution context is already set to the correct database.
11. ONLY output supported methods: find, aggregate, countDocuments, insertOne, updateOne, deleteOne. Do not use methods like db.getCollectionNames().

RESPONSE FORMAT (strict JSON):
{
  "explanation": "Finding all users who signed up in the last 30 days",
  "command": "db.users.find({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })"
}`;
}

export type AgentResponse = {
  explanation: string;
  command: string;
  risk: CommandRisk;
};

export function setupAgentShellMain() {
  ipcMain?.handle(
    'compass-agent-shell:query',
    async (
      _evt,
      {
        userMessage,
        config,
        dbContext,
      }: {
        userMessage: string;
        config: AgentConfig;
        dbContext: {
          dbName: string;
          collections: string[];
          schemaSamples: Record<string, unknown>;
        };
      }
    ): Promise<AgentResponse> => {
      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });

      const systemPrompt = buildSystemPrompt(
        dbContext.dbName,
        dbContext.collections,
        dbContext.schemaSamples
      );

      const response = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content ?? '';

      let parsed: { explanation: string; command: string };
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = {
          explanation: 'Generated command based on your request.',
          command: content.trim(),
        };
      }

      if (!parsed.command) {
        throw new Error(
          'The AI did not generate a valid command. Please try rephrasing your question.'
        );
      }

      const risk = classifyCommand(parsed.command);

      return {
        explanation: parsed.explanation || 'Generated command.',
        command: parsed.command,
        risk,
      };
    }
  );
}
