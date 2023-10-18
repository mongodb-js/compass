import {
  DuplicateCueStepError,
  GroupStepsCompleteError,
  InvalidCueStepError,
  UnregisteredGroupError,
} from './guide-cue-exceptions';
import { type GroupName, GROUP_STEPS_MAP } from './guide-cue-groups';
import {
  CompassGuideCueStorage,
  type GuideCueStorage,
} from './guide-cue-storage';
import { uniq } from 'lodash';

export type ShowCueEventDetail = CustomEvent<{
  cueId: string;
  groupId?: GroupName;
}>;

interface GuideCueEventMap {
  'show-cue': ShowCueEventDetail;
}

export interface GuideCueService extends EventTarget {
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

export type Cue = {
  groupId?: GroupName;
  step: number;
  cueId: string;
  isIntersecting: boolean;
  isVisited: boolean;
};

export class GuideCueService extends EventTarget {
  private _cues: Cue[] = [];

  private _activeGroupId: GroupName | null = null;
  private _activeCue: Cue | null = null;

  constructor(private readonly _storage: GuideCueStorage) {
    super();
  }

  addCue(cue: Omit<Cue, 'isVisited'>) {
    if (process.env.DISABLE_GUIDE_CUES === 'true') {
      return;
    }
    const cueIndex = this.getCueIndex(cue.cueId, cue.groupId);
    if (cueIndex !== -1) {
      // eslint-disable-next-line no-console
      console.warn(`The Cue ${cue.cueId} is already added.`);
      return;
    }

    if (cue.groupId) {
      this.validateCueData(cue.groupId, cue.step);
    }

    this._cues.push({
      ...cue,
      isVisited: this._storage.isCueVisited(cue.cueId, cue.groupId),
    });

    if (!this._activeCue) {
      return this.onNext();
    }

    return this.dispatchShowCueEvent();
  }

  private dispatchShowCueEvent() {
    if (!this._activeCue) {
      return;
    }
    try {
      return this.dispatchEvent(
        new CustomEvent('show-cue', {
          detail: {
            cueId: this._activeCue.cueId,
            groupId: this._activeCue.groupId,
          },
        })
      );
    } catch (ex) {
      // TODO(COMPASS-7357): this seems to be a temporary error happening sometimes during test.
      // In that case, assume the event is not dispatched
    }
  }

  private validateCueData(groupId: GroupName, step: number) {
    if (!GROUP_STEPS_MAP.has(groupId)) {
      throw new UnregisteredGroupError(groupId);
    }

    const groupCues = this._cues.filter((x) => x.groupId === groupId);
    const groupSteps = GROUP_STEPS_MAP.get(groupId)!;

    if (groupCues.length >= groupSteps) {
      throw new GroupStepsCompleteError(groupId, groupSteps);
    }

    if (step > groupSteps) {
      throw new InvalidCueStepError(groupId, groupSteps, step);
    }

    if (groupCues.find((x) => x.step === step)) {
      throw new DuplicateCueStepError(groupId, step);
    }
  }

  removeCue(cueId: string, groupId?: GroupName) {
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

  getCountOfSteps(groupId?: GroupName) {
    return !groupId
      ? 1
      : this._cues.filter((x) => x.groupId === groupId).length || 1;
  }

  private findNextCue(): Cue | null {
    if (this._activeGroupId) {
      const nextCue = this.getNextCueFromGroup(this._activeGroupId);
      if (nextCue) {
        return nextCue;
      }
    }

    const nextCue = this.getNextCueFromNextGroup();
    this._activeGroupId = nextCue?.groupId || null;
    return nextCue;
  }

  private getNextCueFromGroup(groupId: GroupName) {
    const groupCues = this._cues.filter((x) => x.groupId === groupId);
    if (groupCues.length !== GROUP_STEPS_MAP.get(groupId)) {
      return null;
    }
    const unseenCues = groupCues.filter(
      (x) => !x.isVisited && x.isIntersecting
    );
    if (unseenCues.length === 0) {
      return null;
    }
    unseenCues.sort((a, b) => a.step - b.step);
    return unseenCues[0];
  }

  private getNextCueFromNextGroup() {
    let nextPossibleIndex = 0;
    while (nextPossibleIndex < this._cues.length) {
      const cue = this._cues[nextPossibleIndex];

      // standalone
      if (!cue.groupId) {
        if (!cue.isVisited && cue.isIntersecting) {
          return cue;
        }
      } else {
        const nextCue = this.getNextCueFromGroup(cue.groupId);
        if (nextCue) {
          return nextCue;
        }
      }
      nextPossibleIndex++;
    }
    return null;
  }

  private getCueIndex(cueId: string, groupId?: GroupName) {
    return this._cues.findIndex(
      (cue) => cue.cueId === cueId && cue.groupId === groupId
    );
  }

  markCueAsVisited(cueId: string, groupId?: GroupName) {
    const cueIndex = this.getCueIndex(cueId, groupId);
    if (cueIndex === -1) {
      return;
    }
    this._cues[cueIndex].isVisited = true;
    this._storage.markCueAsVisited(cueId, groupId);
    this._activeCue = null;
  }

  markGroupAsVisited(groupId: GroupName) {
    // validate if all the cues of a group have been registered
    const groupCues = this._cues.filter((x) => x.groupId === groupId);
    if (groupCues.length === GROUP_STEPS_MAP.get(groupId)) {
      groupCues.forEach(({ cueId }) => {
        this.markCueAsVisited(cueId, groupId);
      });
    }

    this._activeGroupId = null;
    this._activeCue = null;
  }

  markAllCuesAsVisited() {
    // Mark all standalone cues as visited
    this._cues
      .filter((x) => !x.groupId)
      .forEach(({ cueId, groupId }) => {
        this.markCueAsVisited(cueId, groupId);
      });

    // Mark all the groups with all cues
    const groupIds = uniq(this._cues.map((x) => x.groupId)).filter(
      Boolean
    ) as GroupName[];
    groupIds.forEach((groupId) => this.markGroupAsVisited(groupId));
  }

  onCueIntersectionChange(
    isIntersecting: boolean,
    cueId: string,
    groupId?: GroupName
  ) {
    const cueIndex = this.getCueIndex(cueId, groupId);
    if (cueIndex === -1) {
      return;
    }
    this._cues[cueIndex].isIntersecting = isIntersecting;

    const isNewCueShowable = !this._activeCue && isIntersecting;
    const isActiveCueNotShowable =
      this._activeCue?.cueId === cueId &&
      this._activeCue.groupId === groupId &&
      !isIntersecting;

    if (isActiveCueNotShowable || isNewCueShowable) {
      return this.onNext();
    }
  }
}

export const guideCueService = new GuideCueService(
  new CompassGuideCueStorage()
);
