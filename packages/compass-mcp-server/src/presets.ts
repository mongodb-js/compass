import type { McpPreset } from '@mongodb-js/connection-info';

/**
 * Tools that are always available regardless of the access preset. These do
 * not touch user data — `connect` picks a connection, `list-connections`
 * enumerates them, `compass-open-collection` just navigates the UI.
 */
const ALWAYS_AVAILABLE = [
  'connect',
  'list-connections',
  'compass-open-collection',
];

/** Tools that don't read user documents — purely metadata about clusters. */
const METADATA_TOOLS = [
  'list-databases',
  'list-collections',
  'collection-schema',
  'collection-indexes',
  'collection-storage-size',
  'db-stats',
  'explain',
];

/** Tools that read user documents but never write. */
const READ_DATA_TOOLS = ['find', 'count', 'aggregate'];

/**
 * Tools that mutate data or schema. Currently not registered in
 * `compass-tools.ts` — kept here so the preset table stays exhaustive in
 * case we expose them under the `full-access` preset later.
 */
const WRITE_TOOLS = [
  'insert-many',
  'update-many',
  'delete-many',
  'create-index',
  'drop-index',
  'create-collection',
  'drop-collection',
  'rename-collection',
  'drop-database',
];

const ALLOWLISTS: Record<McpPreset, readonly string[]> = Object.freeze({
  'metadata-only': Object.freeze([...ALWAYS_AVAILABLE, ...METADATA_TOOLS]),
  'read-only': Object.freeze([
    ...ALWAYS_AVAILABLE,
    ...METADATA_TOOLS,
    ...READ_DATA_TOOLS,
  ]),
  'full-access': Object.freeze([
    ...ALWAYS_AVAILABLE,
    ...METADATA_TOOLS,
    ...READ_DATA_TOOLS,
    ...WRITE_TOOLS,
  ]),
});

/** Return the read-only list of tool names allowed for a preset. */
export function presetTools(preset: McpPreset): readonly string[] {
  return ALLOWLISTS[preset];
}

/** Cheap membership check used by the per-call enforcement gate. */
export function isToolAllowed(preset: McpPreset, toolName: string): boolean {
  return ALLOWLISTS[preset].includes(toolName);
}

/** Stable human-readable label used in the UI. */
export function presetLabel(preset: McpPreset): string {
  switch (preset) {
    case 'metadata-only':
      return 'Metadata only';
    case 'read-only':
      return 'Read-only data';
    case 'full-access':
      return 'Full access';
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

export const ALL_PRESETS: readonly McpPreset[] = Object.freeze([
  'metadata-only',
  'read-only',
  'full-access',
]);
