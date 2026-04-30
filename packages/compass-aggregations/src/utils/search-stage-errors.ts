/**
 * Utility for categorizing search index errors.
 *
 * Determines whether an error message indicates an issue with the search index
 * definition that can be fixed by editing the definition.
 *
 * TODO(COMPASS-10449): Use assistant to categorize errors instead of static whitelist
 */

import semver from 'semver';

const INDEX_DEFINITION_ERROR_PATTERNS: RegExp[] = [
  /geoWithin requires path '.*' to be indexed as 'geo'/i,
  /geoShape requires path '.*' to be indexed as 'geo' with indexShapes=true/i,
  /hasAncestor requires .* to be indexed as 'embeddedDocuments'/i,
  /hasAncestor requires path '%s' to be indexed as 'embeddedDocuments'/i,
  /HasRoot requires .* to be indexed as 'embeddedDocuments'/i,
  /returnScope path '.*' must be indexed as embeddedDocument with a non-empty storedSource definitionSyntax./i,
  /near with a geo point origin requires path '.*' to be indexed as 'geo'/i,
  /autocomplete index field definition not present at path .*/i,
  /embeddedDocument requires path '.*' to be indexed as 'embeddedDocuments'/i,
  /Path '.*' needs to be indexed as/i,
];

export function isSearchIndexDefinitionError(errorMessage: string): boolean {
  if (!errorMessage) {
    return false;
  }

  return INDEX_DEFINITION_ERROR_PATTERNS.some((pattern) =>
    pattern.test(errorMessage)
  );
}

export const RERANK_MIN_SERVER_VERSION = '8.3.0';

export function isRerankVersionSupported(serverVersion: string): boolean {
  const normalized = semver.valid(semver.coerce(serverVersion));
  return !!normalized && semver.gte(normalized, RERANK_MIN_SERVER_VERSION);
}

export function isRerankNotEnabledError(errorMessage: string): boolean {
  if (!errorMessage) {
    return false;
  }

  const lower = errorMessage.toLowerCase();
  return (
    lower.includes('$rerank is not enabled') &&
    lower.includes('enable the $rerank project setting')
  );
}

export type VoyageRateLimitInfo = {
  type: 'rpm' | 'tpm';
  limit: string;
  model: string;
};

const RPM_PATTERN = /of (\d[\d,]*) requests per minute for ([^\s.,]+)/;
const TPM_PATTERN = /of (\d[\d,]*) tokens per minute for ([^\s.,]+)/;

export function getVoyageProjectRateLimitInfo(
  errorMessage: string
): VoyageRateLimitInfo | null {
  if (!errorMessage) {
    return null;
  }
  // RPM checked first per design spec
  const rpm = RPM_PATTERN.exec(errorMessage);
  if (rpm) {
    return { type: 'rpm', limit: rpm[1], model: rpm[2] };
  }
  const tpm = TPM_PATTERN.exec(errorMessage);
  if (tpm) {
    return { type: 'tpm', limit: tpm[1], model: tpm[2] };
  }
  return null;
}
