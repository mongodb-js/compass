export interface GuideCueStorage {
  isCueVisited: (group: string, id: string) => boolean;
  markCueAsVisited: (group: string, id: string) => void;
}
