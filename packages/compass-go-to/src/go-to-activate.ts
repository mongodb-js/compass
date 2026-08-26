import type { GoToCandidate } from './go-to-candidates';

export type GoToWorkspaces = {
  openDatabasesWorkspace: (connectionId: string) => void;
  openCollectionsWorkspace: (connectionId: string, namespace: string) => void;
  openCollectionWorkspace: (connectionId: string, namespace: string) => void;
};

/**
 * Opens or focuses the workspace that the sidebar would for the same target.
 * Disconnected connection rows are ignored (activation is connected-only).
 * Returns whether a workspace was opened.
 */
export function activateGoToCandidate(
  candidate: GoToCandidate,
  workspaces: GoToWorkspaces
): boolean {
  if (!candidate.connected) {
    return false;
  }

  if (candidate.kind === 'connection') {
    workspaces.openDatabasesWorkspace(candidate.connectionId);
    return true;
  }

  if (candidate.kind === 'database' && candidate.namespace) {
    workspaces.openCollectionsWorkspace(
      candidate.connectionId,
      candidate.namespace
    );
    return true;
  }

  if (candidate.kind === 'collection' && candidate.namespace) {
    workspaces.openCollectionWorkspace(
      candidate.connectionId,
      candidate.namespace
    );
    return true;
  }

  return false;
}
