import {
  CompassGuideCueStorage,
  type GuideCueStorage,
} from './guide-cue-storage';

import { type GuideCueProps } from './guide-cue-group';

export type CueAddedEventDetail = CustomEvent;
export type CueRemovedEventDetail = CustomEvent<{
  cueId: string;
  groupId?: string;
}>;
export type CueGroupUpdatedEventDetail = CustomEvent<{
  group: CueGroup;
}>;
interface GuideCueEventMap {
  'cue-added': CueAddedEventDetail;
  'cue-removed': CueRemovedEventDetail;
  'cue-group-updated': CueGroupUpdatedEventDetail;
}

interface GuideCueService extends EventTarget {
  addEventListener<K extends keyof GuideCueEventMap>(
    type: K,
    listener: (this: GuideCueEventMap, ev: GuideCueEventMap[K]) => void
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void;
  removeEventListener<K extends keyof GuideCueEventMap>(
    type: K,
    listener: (this: GuideCueEventMap, ev: GuideCueEventMap[K]) => void
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void;
}

type Cue = GuideCueProps & {
  refEl: React.RefObject<HTMLSpanElement>;
};

type CueWithServiceProps = Cue & {
  isVisited: boolean;
  isIntersecting: boolean;
};

export type CueGroup =
  | {
      // Grouped Guide Cues
      id: string;
      steps: number;
      cues: Array<CueWithServiceProps>;
    }
  | {
      // Standalone Guide Cue
      id: undefined;
      steps: 1;
      cues: [CueWithServiceProps];
    };

class GuideCueService extends EventTarget {
  private _groups: Array<CueGroup> = [];

  private _activeGroup: CueGroup | null = null;
  private _activeGroupIndex: number | null = null;

  constructor(private readonly _storage: GuideCueStorage) {
    super();
  }

  addGroup({ id, steps }: { id: string; steps: number }) {
    const groupIndex = this.getGroupIndex(id);
    if (groupIndex !== -1) {
      throw new Error(`Guide Cue group ${id} already registered.`);
    }
    this._groups.push({ steps, cues: [], id });
  }
  removeGroup(id: string) {
    const groupIndex = this.getGroupIndex(id);
    if (groupIndex !== -1) {
      this._groups.splice(groupIndex, 1);
    }
  }

  addCue(cue: Cue, groupId?: string) {
    if (groupId) {
      this.addCueInGroup(cue, groupId);
    } else {
      this.addStandaloneCue(cue);
    }

    return this.dispatchEvent(
      new CustomEvent('cue-added', {
        detail: {},
      })
    );
  }
  removeCue(cueId: string, groupId?: string) {
    if (groupId) {
      this.removeCueInGroup(cueId, groupId);
    } else {
      this.removeStandaloneCue(cueId);
    }

    return this.dispatchEvent(
      new CustomEvent('cue-removed', {
        detail: { cueId, groupId },
      })
    );
  }

  private getGroupIndex(id: string) {
    return this._groups.findIndex((x) => x.id === id);
  }

  private addCueInGroup(cue: Cue, groupId: string) {
    const groupIndex = this.getGroupIndex(groupId);
    if (groupIndex === -1) {
      throw new Error(
        `Can not add Guide Cue ${cue.id} to the group ${groupId}. Please add a group first.`
      );
    }

    const group = this._groups[groupIndex];

    const cueIndex = group.cues.findIndex((x) => x.id === cue.id);

    if (cueIndex !== -1) {
      throw new Error(
        `Guide Cue ${cue.id} is already registered with ${groupId} group.`
      );
    }

    if (group.steps < group.cues.length + 1) {
      throw new Error(
        `Can not add Guide Cue ${cue.id} to group ${groupId}. Group cues exceed group steps.`
      );
    }

    const isVisited = this._storage.isCueVisited(cue.id, groupId);
    this._groups[groupIndex].cues.push({
      ...cue,
      isVisited,
      isIntersecting: true,
    });
  }
  private addStandaloneCue(cue: Cue) {
    const cueIndex = this._groups
      .filter((x) => !x.id)
      .flatMap((x) => x.cues)
      .findIndex((x) => x.id === cue.id);
    if (cueIndex !== -1) {
      throw new Error(
        `Guide Cue ${cue.id} is already registered as a standlone Guide Cue.`
      );
    }

    const isVisited = this._storage.isCueVisited(cue.id);
    this._groups.push({
      steps: 1,
      cues: [{ ...cue, isIntersecting: true, isVisited }],
      id: undefined,
    });
  }

  private removeCueInGroup(cueId: string, groupId: string) {
    const groupIndex = this.getGroupIndex(groupId);
    if (groupIndex === -1) {
      return;
    }
    const cueIndex = this._groups[groupIndex].cues.findIndex(
      (x) => x.id === cueId
    );
    this._groups[groupIndex].cues.splice(cueIndex, 1);
  }
  private removeStandaloneCue(cueId: string) {
    const groupIndex = this._groups.findIndex(
      (x) => !x.id && x.cues.find((c) => c.id === cueId)
    );
    if (groupIndex === -1) {
      return;
    }
    this._groups.splice(groupIndex, 1);
  }

  getNextGroup(): CueGroup | null {
    let nextGroupIndex = 0;
    let foundNextGroup = false;

    while (nextGroupIndex < this._groups.length) {
      if (this.canViewGroup(nextGroupIndex)) {
        foundNextGroup = true;
        break;
      }
      nextGroupIndex++;
    }

    if (!foundNextGroup) {
      this._activeGroup = null;
      this._activeGroupIndex = null;
    } else {
      const nextGroup = this._groups[nextGroupIndex];
      const unseenCues = nextGroup.cues.filter((x) => !x.isVisited);
      unseenCues.sort((a, b) => a.step - b.step);
      const newGroup: CueGroup = nextGroup.id
        ? {
            cues: unseenCues,
            steps: unseenCues.length,
            id: nextGroup.id,
          }
        : {
            cues: [unseenCues[0]],
            steps: 1,
            id: undefined,
          };

      this._activeGroup = newGroup;
      this._activeGroupIndex = nextGroupIndex;
    }

    return this._activeGroup;
  }

  private canViewGroup(groupIndex: number) {
    const group = this._groups[groupIndex];
    if (!group) {
      return false;
    }

    if (group.cues.length !== group.steps) {
      return false;
    }

    const unvisitedCues = group.cues.filter((x) => !x.isVisited);
    if (unvisitedCues.length === 0) {
      return false;
    }

    const unIntersectingCues = unvisitedCues.filter(
      (x) => x.isIntersecting
    ).length;
    if (unIntersectingCues === 0) {
      return false;
    }

    return true;
  }

  updateCueIntersection(
    isIntersecting: boolean,
    cueId: string,
    groupId?: string
  ) {
    this._groups = this._groups.map((group) => {
      if (group.id === groupId) {
        group.cues = group.cues.map((cue) => {
          if (cue.id === cueId) {
            cue.isIntersecting = isIntersecting;
          }
          return cue;
        });
      }
      return group;
    });

    // If the cue belongs to the active group and is not intersecting, fire an event
    if (
      !isIntersecting &&
      this._activeGroup &&
      this._activeGroup.id === groupId
    ) {
      const cueIndex = this._activeGroup.cues.findIndex((x) => x.id === cueId);
      if (cueIndex > -1) {
        this.dispatchEvent(
          new CustomEvent('cue-group-updated', {
            detail: {
              cueGroup: this._activeGroup,
            },
          })
        );
      }
    }
  }

  markCueAsVisited(cueId: string, groupId?: string) {
    // todo: clean up and use this.getGroupIndex
    const groupIndex = this._groups.findIndex(
      (x) => x.id === groupId && x.cues.find((x) => x.id === cueId)
    );
    if (groupIndex === -1) {
      return;
    }

    const cueIndex = this._groups[groupIndex].cues.findIndex(
      (x) => x.id === cueId
    );
    if (cueIndex === -1) {
      return;
    }

    this._groups[groupIndex].cues[cueIndex].isVisited = true;
    this._storage.markCueAsVisited(cueId, groupId);
  }
  markGroupAsVisited(groupId: string) {
    const groupIndex = this.getGroupIndex(groupId);
    if (groupIndex === -1) {
      return;
    }

    const cues = this._groups[groupIndex].cues.map((x) => ({
      ...x,
      isVisited: true,
    }));
    this._groups[groupIndex].cues = cues;

    // Update storage.
    cues.forEach(({ id }) => {
      this._storage.markCueAsVisited(id, groupId);
    });
  }
}

export const guideCueService = new GuideCueService(
  new CompassGuideCueStorage()
);
