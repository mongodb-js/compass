import { type GuideCueStorage } from './guide-cue-storage';

interface GuideCueEventMap {
  'cue-list-changed': CustomEvent;
}

/**
 * Assumptions:
 *  1. If any Guide Cue from the group is not visible, we will move to the next group - its either all or none.
 *  2. Once the whole group has been visited, we will remove it from the service.
 */

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
  id: string;
  title: string;
  group: string;
  content: React.ReactNode;
  refEl: React.RefObject<HTMLElement>;
  intersectingRef: React.RefObject<HTMLElement>;
};

type CueWithServiceProps = Cue & {
  isVisited: boolean;
  // If we were not able to show GC because its intersectingRef
  // was not in viewport, we mark it as isNotIntersecting.
  isIntersecting: boolean;
};

export class GuideCueService extends EventTarget {
  private _cues: Array<CueWithServiceProps> = [];
  private _activeGroupCues: Array<CueWithServiceProps> = [];
  private _activeCue: CueWithServiceProps | null = null;

  constructor(private _storage: GuideCueStorage) {
    super();
  }

  get numOfCuesInGroup() {
    return this._activeGroupCues.length;
  }

  get currentCueIndexInGroup() {
    return this._activeGroupCues.findIndex((x) => x.id === this._activeCue?.id);
  }

  private getCueIndexes(cue: Pick<Cue, 'group' | 'id'>) {
    return {
      listIndex: this._cues.findIndex(
        ({ id, group }) => cue.group === group && cue.id === id
      ),
      groupIndex: this._activeGroupCues.findIndex(
        ({ id, group }) => cue.group === group && cue.id === id
      ),
    };
  }

  addCue(cue: Cue) {
    if (this._storage.isCueVisited(cue.group, cue.id)) {
      return;
    }

    const existingCue = this._cues.find(
      ({ id, group }) => id === cue.id && group === cue.group
    );
    if (existingCue?.isVisited) {
      return;
    }

    if (existingCue) {
      throw new Error(
        `Guide Cue with id ${cue.id} is already registered in ${cue.group} group.`
      );
    }

    this._cues.push({ ...cue, isVisited: false, isIntersecting: true });

    // If we have an active group and added cue belongs to same,
    // then we have to update the list.
    if (this._activeCue?.group === cue.group) {
      this._activeGroupCues = this._cues.filter((x) => x.group === cue.group);
    }

    return this.dispatchEvent(
      new CustomEvent('cue-list-changed', {
        detail: {},
      })
    );
  }

  removeCue(cue: Pick<Cue, 'group' | 'id'>) {
    const { groupIndex, listIndex } = this.getCueIndexes(cue);
    if (listIndex !== -1) {
      this._cues.splice(listIndex, 1);
    }
    if (groupIndex !== -1) {
      this._activeGroupCues.splice(groupIndex, 1);
    }
  }

  getNextCue() {
    if (this._cues.length === 0) {
      return null;
    }

    // First time, when nothing is shown yet.
    if (!this._activeCue) {
      return this.getInitialCue();
    }

    // If the current cue is not last, then show next cue.
    const nextPossibleCue = this.getNextCueFromActiveGroup();
    if (nextPossibleCue) {
      return nextPossibleCue;
    }

    // Get the next group
    return this.getFirstCueFromNextGroup();
  }

  private getInitialCue() {
    this._activeCue =
      this._cues.find((x) => !x.isVisited && x.isIntersecting) ?? null;
    this._activeGroupCues = this._cues.filter(
      (x) => x.group === this._activeCue?.group
    );
    return this._activeCue;
  }

  private getNextGroup() {
    // Get the next group
    const groups = this._cues
      .filter((x) => !x.isVisited && x.isIntersecting)
      .map((x) => x.group)
      .filter((v, i, a) => a.indexOf(v) === i);
    return groups[0] || null;
  }

  private getNextCueFromActiveGroup() {
    const currentCueIndex = this._activeGroupCues.findIndex(
      (x) => x.id === this._activeCue?.id
    );
    // If the index is last one
    if (currentCueIndex + 1 === this._activeGroupCues.length) {
      return null;
    }

    const possibleCues = this._activeGroupCues
      .slice(currentCueIndex)
      .filter((x) => !x.isVisited && x.isIntersecting);

    this._activeCue = possibleCues[0];
    return this._activeCue;
  }

  moveToNextGroup() {
    this._activeGroupCues = [];
  }

  getFirstCueFromNextGroup() {
    const nextGroup = this.getNextGroup();
    if (!nextGroup) {
      this._activeGroupCues = [];
      this._activeCue = null;
    } else {
      this._activeGroupCues = this._cues.filter(
        (x) => x.group === nextGroup && !x.isVisited && x.isIntersecting
      );
      this._activeCue = this._activeGroupCues[0];
    }
    return this._activeCue;
  }

  markCueAsNotIntersecting() {
    if (this._activeCue) {
      this.updateCueProperty(this._activeCue, 'isIntersecting', false);
    }
  }

  markCueAsVisited() {
    if (this._activeCue) {
      this.updateCueProperty(this._activeCue, 'isVisited', true);
      this._storage.markCueAsVisited(this._activeCue.group, this._activeCue.id);
    }
  }

  private updateCueProperty<T extends keyof CueWithServiceProps>(
    cue: Pick<Cue, 'id' | 'group'>,
    prop: T,
    value: CueWithServiceProps[T]
  ) {
    const { listIndex, groupIndex } = this.getCueIndexes(cue);
    if (listIndex !== -1) {
      this._cues[listIndex][prop] = value;
    }
    if (groupIndex !== -1) {
      this._activeGroupCues[groupIndex][prop] = value;
    }
  }

  markGroupAsVisited() {
    if (this._activeCue) {
      this._activeGroupCues.forEach(({ group, id }) => {
        this._storage.markCueAsVisited(group, id);
      });
      this._cues = this._cues.filter((x) => x.group !== this._activeCue.group);
    }
  }
}
