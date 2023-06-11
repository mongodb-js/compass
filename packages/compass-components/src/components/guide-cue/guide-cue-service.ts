import {
  CompassGuideCueStorage,
  type GuideCueStorage,
} from './guide-cue-storage';

export type ShowCueEventDetail = CustomEvent<{
  cueId: string;
  groupId?: string;
}>;
interface GuideCueEventMap {
  'show-cue': ShowCueEventDetail;
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

type Cue = {
  groupId?: string;
  step: number;
  cueId: string;
};

type CueWithServiceProps = Cue & {
  isVisited: boolean;
  isIntersecting: boolean;
};

type Group = {
  readonly id: string;
  readonly steps: number;
};

export const GROUPS: Group[] = [
  {
    id: 'ConnectionForm',
    steps: 2,
  },
  {
    id: 'FormHelp',
    steps: 4,
  },
  {
    id: 'SidebarNavigation',
    steps: 2,
  },
  {
    id: 'Shell',
    steps: 2,
  },
  {
    id: 'Stage Toolbar',
    steps: 5,
  },
];

const GROUP_TO_STEPS = Object.fromEntries(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(GROUPS).map(([_, val]) => [val.id, val.steps])
);

class GuideCueService extends EventTarget {
  private _cues: Array<CueWithServiceProps> = [];

  private _activeGroupId: string | null = null;
  private _activeCue: CueWithServiceProps | null = null;

  constructor(private readonly _storage: GuideCueStorage) {
    super();
  }

  addCue(cue: Cue) {
    const cueIndex = this.getCueIndex(cue.cueId, cue.groupId);
    if (cueIndex !== -1) {
      console.warn(`The Cue ${cue.cueId} is already `);
      return;
    }

    const isVisited = this._storage.isCueVisited(cue.cueId, cue.groupId);
    this._cues.push({ ...cue, isVisited, isIntersecting: true });

    if (!this._activeCue) {
      return this.onNext();
    }

    return this.dispatchShowCueEvent();
  }

  private dispatchShowCueEvent() {
    if (!this._activeCue) {
      return;
    }
    return this.dispatchEvent(
      new CustomEvent('show-cue', {
        detail: {
          cueId: this._activeCue.cueId,
          groupId: this._activeCue.groupId,
        },
      })
    );
  }

  validateCueData({ cueId, step, groupId }: Cue) {
    if (!groupId) {
      return;
    }

    if (!GROUPS.find((x) => x.id === groupId)) {
      throw new Error(`The group ${groupId} not registered.`);
    }

    const groupCues = this._cues.filter((x) => x.groupId === groupId);
    const groupSteps = GROUP_TO_STEPS[groupId];

    if (groupCues.length >= groupSteps) {
      throw new Error(
        `Group ${groupId} has already ${GROUP_TO_STEPS[groupId]} steps. Can not add ${cueId}.`
      );
    }

    if (step > groupSteps) {
      throw new Error(
        `Group ${groupId} has only ${GROUP_TO_STEPS[groupId]} steps. Can not add another with step:${step}.`
      );
    }

    if (groupCues.find((x) => x.step === step)) {
      throw new Error(
        `Cue with step ${step} is already registered with ${groupId}.`
      );
    }
  }

  removeCue({ cueId, groupId }: Cue) {
    const cueIndex = this._cues.findIndex(
      (cue) => cue.cueId === cueId && cue.groupId === groupId
    );
    if (cueIndex === -1) {
      return;
    }
    this._cues.splice(cueIndex, 1);

    if (
      this._activeCue?.cueId === cueId &&
      this._activeCue.groupId === groupId
    ) {
      this._activeCue = null;
    }
  }

  onNext() {
    this._activeCue = this.findNextCue();
    return this.dispatchShowCueEvent();
  }

  getCountOfSteps(groupId?: string) {
    if (!groupId) {
      return 1;
    }

    return GROUP_TO_STEPS[groupId] ?? 1;
  }

  private findNextCue(): CueWithServiceProps | null {
    if (this._activeGroupId) {
      const nextCue = this.getNextCueFromGroup(this._activeGroupId);
      if (nextCue) {
        return nextCue;
      }
    }

    return this.getNextCueFromNextGroup();
  }

  private getNextCueFromNextGroup() {
    let nextPossibleIndex = 0;
    while (nextPossibleIndex < this._cues.length) {
      const cue = this._cues[nextPossibleIndex];

      // standalone
      if (!cue.groupId) {
        if (!cue.isVisited && cue.isIntersecting) {
          this._activeGroupId = null;
          return cue;
        }
      } else {
        const groupCues = this._cues.filter((x) => x.groupId === cue.groupId);
        if (groupCues.length === GROUP_TO_STEPS[cue.groupId]) {
          const unseenCues = groupCues.filter(
            (x) => !x.isVisited && x.isIntersecting
          );
          if (unseenCues.length > 0) {
            unseenCues.sort((a, b) => a.step - b.step);
            this._activeGroupId = unseenCues[0].groupId ?? null;
            return unseenCues[0];
          }
        }
      }
      nextPossibleIndex++;
    }
    return null;
  }

  private getNextCueFromGroup(groupId: string) {
    const groupCues = this._cues.filter((x) => x.groupId === groupId);
    if (groupCues.length !== GROUP_TO_STEPS[groupId]) {
      return null;
    }
    groupCues.sort((a, b) => a.step - b.step);

    const unseenCues = groupCues.filter(
      (x) => !x.isVisited && x.isIntersecting
    );
    if (unseenCues.length === 0) {
      return null;
    }
    return unseenCues[0];
  }

  private getCueIndex(cueId: string, groupId?: string) {
    return this._cues.findIndex(
      (cue) => cue.cueId === cueId && cue.groupId === groupId
    );
  }

  markCueAsVisited(cueId: string, groupId?: string) {
    const cueIndex = this.getCueIndex(cueId, groupId);
    if (cueIndex === -1) {
      return;
    }
    this._cues[cueIndex].isVisited = true;
    this._storage.markCueAsVisited(cueId, groupId);
  }

  markGroupAsVisited(groupId?: string) {
    // standalone
    if (!groupId) {
      return;
    }
    this._cues
      .filter((x) => x.groupId === groupId)
      .forEach(({ cueId }) => {
        this.markCueAsVisited(cueId, groupId);
      });
    this._activeGroupId = null;
  }

  updateCueIntersection(isIntersecting: boolean, { cueId, groupId }: Cue) {
    const cueIndex = this.getCueIndex(cueId, groupId);
    if (cueIndex === -1) {
      return;
    }
    this._cues[cueIndex].isIntersecting = isIntersecting;
  }
}

export const guideCueService = new GuideCueService(
  new CompassGuideCueStorage()
);

(window as any).guideCueService = guideCueService;
