const GUIDE_CUE_KEY = 'compass_guide_cues';

type GuideCueData = Array<{ groupId?: string; cueId: string }>;

export interface GuideCueStorage {
  isCueVisited: (cueId: string, groupId?: string) => boolean;
  markCueAsVisited: (cueId: string, groupId?: string) => void;
}

export class CompassGuideCueStorage implements GuideCueStorage {
  constructor(
    private readonly storage: Pick<
      Storage,
      'getItem' | 'setItem'
    > = globalThis.localStorage,
    private readonly key: string = GUIDE_CUE_KEY
  ) {}

  get data(): GuideCueData {
    try {
      return JSON.parse(this.storage.getItem(this.key) ?? '[]');
    } catch (e) {
      return [];
    }
  }

  set data(newData) {
    this.storage.setItem(this.key, JSON.stringify(newData));
  }

  isCueVisited(cueId: string, groupId?: string) {
    return !!this.data.find((x) => x.cueId === cueId && x.groupId === groupId);
  }

  markCueAsVisited(cueId: string, groupId?: string) {
    if (!this.isCueVisited(cueId, groupId)) {
      const newData = this.data;
      newData.push({ groupId, cueId });
      this.data = newData;
    }
  }
}
