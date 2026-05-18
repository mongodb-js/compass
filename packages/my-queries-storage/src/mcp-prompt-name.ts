/**
 * Validation for the "MCP prompt name" a user can assign to a saved query
 * or aggregation. When set, the MCP server registers the saved item as an
 * MCP prompt — exposed in AI clients (Claude Desktop, Cursor, …) as a
 * slash command — so the user can run the saved query by picking it from
 * the slash menu instead of asking the AI to figure it out from context.
 *
 * The naming rules below match what AI clients are comfortable surfacing
 * in their slash UIs:
 *
 *   - Lowercase ASCII letters, digits, and hyphens.
 *   - Must start with a letter.
 *   - Must not end with a hyphen.
 *   - 1–64 characters.
 *
 * The same module is consumed by:
 *   - The query / pipeline Zod schemas (storage-level validation).
 *   - The Compass edit-item UI (live input validation + error text).
 *   - The MCP server (uniqueness check at prompt-registration time).
 *
 * Kept dependency-free so it can be imported by both UI and server code
 * without dragging anything along.
 */

export const MCP_PROMPT_NAME_PATTERN = /^[a-z](?:[a-z0-9-]*[a-z0-9])?$/;
export const MCP_PROMPT_NAME_MIN_LENGTH = 1;
export const MCP_PROMPT_NAME_MAX_LENGTH = 64;

/** User-facing hint describing the rules. Suitable for an `<input>` aria-description. */
export const MCP_PROMPT_NAME_HINT =
  'Lowercase letters, digits, and hyphens. Must start with a letter ' +
  'and may not end with a hyphen. 1–64 characters.';

export function isValidMcpPromptName(input: unknown): input is string {
  if (typeof input !== 'string') return false;
  if (input.length < MCP_PROMPT_NAME_MIN_LENGTH) return false;
  if (input.length > MCP_PROMPT_NAME_MAX_LENGTH) return false;
  return MCP_PROMPT_NAME_PATTERN.test(input);
}

/**
 * Returns a user-facing reason the given string is not a valid prompt
 * name, or `null` if it is valid. Used by the edit-item UI to render a
 * targeted error instead of just "invalid".
 */
export function validateMcpPromptName(input: string): string | null {
  if (input.length === 0) {
    return null; // empty = not setting one; not an error
  }
  if (input.length > MCP_PROMPT_NAME_MAX_LENGTH) {
    return `Must be at most ${MCP_PROMPT_NAME_MAX_LENGTH} characters.`;
  }
  if (!/^[a-z]/.test(input)) {
    return 'Must start with a lowercase letter.';
  }
  if (input.endsWith('-')) {
    return 'May not end with a hyphen.';
  }
  if (!MCP_PROMPT_NAME_PATTERN.test(input)) {
    return 'Only lowercase letters, digits, and hyphens are allowed.';
  }
  return null;
}

/**
 * Convert a free-form name into a candidate MCP prompt name. Used as the
 * default value pre-filled in the edit-item UI when a user enters a
 * description but hasn't picked a prompt name yet. The result is
 * guaranteed valid per `isValidMcpPromptName` if the source has at least
 * one ASCII letter; otherwise returns an empty string.
 */
export function suggestMcpPromptName(source: string): string {
  let s = source
    .toLowerCase()
    .normalize('NFKD')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7f]/g, '') // strip non-ASCII (after NFKD strips accents)
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-{2,}/g, '-');
  if (s.length > MCP_PROMPT_NAME_MAX_LENGTH) {
    s = s.slice(0, MCP_PROMPT_NAME_MAX_LENGTH).replace(/-+$/, '');
  }
  return isValidMcpPromptName(s) ? s : '';
}
