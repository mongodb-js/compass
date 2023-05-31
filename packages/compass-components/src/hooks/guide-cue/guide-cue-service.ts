import { type GuideCueStorage } from './guide-cue-storage';

// todo: extend (some) LGGuideCue props to enable customization.
export type Cue = {
  id: string;
  groupId: string;

  title: string;
  content: React.ReactNode;
  refEl: React.RefObject<HTMLElement>;
  intersectingRef: React.RefObject<HTMLElement>;
};

type CueWithServiceProps = Cue & {
  // default: false
  isVisited: boolean;
  // default: true and once it can not be shown,
  // update this to false and never show again.
  isIntersecting: boolean;
};
interface GuideCueEventMap {
  'cue-added': CustomEvent;
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

export class GuideCueService extends EventTarget {
  /**
   * List of all the registered Guide Cues. As user finishes
   * visiting the group, we clear it out from this list
   */
  private _cues: Array<CueWithServiceProps> = [];
  /**
   * List of Guide Cues from the currently active group.
   */
  private _activeGroupCues: Array<CueWithServiceProps> = [];
  /**
   * Currently active Guide Cue which is being shown to the user.
   */
  private _activeCue: CueWithServiceProps | null = null;

  constructor(private _storage: GuideCueStorage) {
    super();
  }

  // Total number of steps in a Guide Cue
  get numOfCuesInGroup() {
    return this._activeGroupCues.length;
  }

  // Current step in a Guide Cue
  get currentCueIndexInGroup() {
    return this._activeGroupCues.findIndex((x) => x.id === this._activeCue?.id);
  }

  /**
   * Get the cue indexes in the list of all registered
   * cues and in the currently active group.
   */
  private getCueIndexes(cue: Pick<Cue, 'groupId' | 'id'>) {
    return {
      listIndex: this._cues.findIndex(
        ({ id, groupId }) => cue.groupId === groupId && cue.id === id
      ),
      groupIndex: this._activeGroupCues.findIndex(
        ({ id, groupId }) => cue.groupId === groupId && cue.id === id
      ),
    };
  }

  addCue(cue: Cue) {
    if (this._storage.isCueVisited(cue.groupId, cue.id)) {
      return;
    }

    // If user has just seen it already, do not register it again
    const existingCue = this._cues.find(
      ({ id, groupId }) => id === cue.id && groupId === cue.groupId
    );
    if (existingCue?.isVisited) {
      return;
    }

    if (existingCue) {
      throw new Error(
        `Guide Cue with id ${cue.id} is already registered within ${cue.groupId} group.`
      );
    }

    this._cues.push({ ...cue, isVisited: false, isIntersecting: true });

    // If we have an active group and added cue belongs to the same,
    // then we have to update the list.
    if (this._activeCue?.groupId === cue.groupId) {
      this._activeGroupCues = this._cues.filter(
        (x) => x.groupId === cue.groupId
      );
    }

    return this.dispatchEvent(
      new CustomEvent('cue-added', {
        detail: {},
      })
    );
  }

  removeCue(cue: Pick<Cue, 'groupId' | 'id'>) {
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

    if (!this._activeCue) {
      return this.getInitialCue();
    }

    // Try to get the cue from the current group, if not
    // move to the next group.
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
      (x) => x.groupId === this._activeCue?.groupId
    );
    return this._activeCue;
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

  private getFirstCueFromNextGroup() {
    const nextGroup = this.getNextGroupId();
    if (!nextGroup) {
      this._activeGroupCues = [];
      this._activeCue = null;
    } else {
      this._activeGroupCues = this._cues.filter(
        (x) => x.groupId === nextGroup && !x.isVisited && x.isIntersecting
      );
      this._activeCue = this._activeGroupCues[0];
    }
    return this._activeCue;
  }

  private getNextGroupId() {
    // Get the next group Id
    const groups = this._cues
      .filter((x) => !x.isVisited && x.isIntersecting)
      .map((x) => x.groupId)
      .filter((v, i, a) => a.indexOf(v) === i);
    return groups[0] || null;
  }

  // todo: clean up from here.
  markCueAsNotIntersecting() {
    if (this._activeCue) {
      this.updateCueProperty(this._activeCue, 'isIntersecting', false);
    }
  }

  markCueAsVisited() {
    if (this._activeCue) {
      this.updateCueProperty(this._activeCue, 'isVisited', true);
      this._storage.markCueAsVisited(
        this._activeCue.groupId,
        this._activeCue.id
      );
    }
  }

  private updateCueProperty<T extends keyof CueWithServiceProps>(
    cue: Pick<Cue, 'id' | 'groupId'>,
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
      this._activeGroupCues.forEach(({ groupId, id }) => {
        this._storage.markCueAsVisited(groupId, id);
      });
      this._cues = this._cues.filter(
        (x) => x.groupId !== this._activeCue?.groupId
      );
    }
    this._activeGroupCues = [];
  }
}
