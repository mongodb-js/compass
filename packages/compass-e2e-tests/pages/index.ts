// Slots are added to this interface by migration PRs as page objects are
// introduced. See pages/README.md.
// TODO: Drop this lint disable as soon as the first page object slot is added
// (planned PR 1.1, sidebar) — the interface will no longer be empty.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Pages {}

export function buildPages(): Pages {
  return {};
}
