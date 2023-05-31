export interface GuideCueStorage {
  isCueVisited: (groupId: string, cueId: string) => boolean;
  markCueAsVisited: (groupId: string, cueId: string) => void;
}
