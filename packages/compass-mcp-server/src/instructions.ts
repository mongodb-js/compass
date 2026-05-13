import { TransportRunnerBase } from 'mongodb-mcp-server';

/**
 * String returned in the MCP `initialize` response's `instructions` field.
 * Both Claude Desktop and Cursor inject this into the model's system prompt,
 * so the AI knows our workflow from session start — before it ever calls a
 * tool or hits an error path.
 *
 * Kept in third person ("you"), action-oriented, and short enough not to
 * dominate the system prompt. Anything more nuanced (per-tool details)
 * stays in the tool descriptions themselves.
 */
export const COMPASS_INSTRUCTIONS = `
You are connected to MongoDB Compass via a local MCP server.

Required workflow before any data or metadata tool can succeed:
  1. Call list-connections to get the user's saved Compass connections.
     Each entry has an "id" and a "name".
  2. Call connect with connectionId set to one of those ids.
  3. Then call read / metadata tools (find, aggregate, collection-schema, etc.).

NEVER ask the user for a connection string and NEVER pass a connection string to connect — this server only accepts Compass connection ids returned by list-connections. If list-connections returns an empty list, tell the user to add a connection in Compass first.

Per-connection access policy: each Compass connection has one of three presets that gates which tools are usable against it:
  - metadata-only: schema, indexes, storage size, query plans, db stats (no documents read)
  - read-only:     metadata + find / count / aggregate
  - full-access:   read-only + writes (insert / update / delete + DDL); also allows $out / $merge in aggregate

A tool call may be rejected with "access denied by Compass" if the active connection's preset doesn't include it. Relay the message to the user — they can adjust the preset from the connection's AI access tab in Compass.

Efficient data exploration:
- For "how big is this" / "how many docs" questions, prefer collection-storage-size and db-stats (metadata, O(1)) over count. Calling count without an indexed filter performs a full collection scan.
- Call collection-schema and collection-indexes before designing aggregations so the pipeline can use an index.
- Use explain to verify a query plan before running heavy queries.

When the user wants to interact with data visually (browse documents, iterate on a query, step through an aggregation), call compass-open-collection. It opens the collection in the Compass UI; you don't need to dump documents inline.
`.trim();

let patched = false;

/**
 * Replaces the upstream `TransportRunnerBase.getInstructions` static with
 * one that returns the Compass-specific text. The upstream `createServer`
 * code calls this static directly (`TransportRunnerBase.getInstructions(...)`)
 * rather than via inheritance, so subclassing isn't enough — but the static
 * is a plain function property and is therefore reassignable.
 *
 * Idempotent: calling more than once is a no-op so import-from-anywhere is
 * safe.
 */
export function installCompassMcpInstructions(): void {
  if (patched) return;
  patched = true;
  (
    TransportRunnerBase as unknown as {
      getInstructions: (config: unknown) => string;
    }
  ).getInstructions = () => COMPASS_INSTRUCTIONS;
}
