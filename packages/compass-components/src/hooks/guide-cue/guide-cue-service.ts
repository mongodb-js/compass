import { type GuideCueStorage } from './guide-cue-storage';
import { type GuideCueProps } from './use-guide-cue';

export type Cue = GuideCueProps & {
  refEl: React.RefObject<HTMLElement>;
};

type CueWithServiceProps = Cue & {
  // default: false
  isVisited: boolean;
  // default: true and once it can not be shown,
  // update this to false and never show again.
  isIntersecting: boolean;
};

export type CueAddedEventDetail = CustomEvent;
export type CueRemovedEventDetail = CustomEvent<{
  cue: Pick<Cue, 'id' | 'groupId'>;
}>;
interface GuideCueEventMap {
  'cue-added': CueAddedEventDetail;
  'cue-removed': CueRemovedEventDetail;
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
      // In order not to mess with sorting, we push carefully.
      const { groupIndex } = this.getCueIndexes(this._activeCue);
      const newActiveCues = [
        ...this._activeGroupCues.slice(0, groupIndex),
        this._activeCue,
        ...this.sortCues([
          ...this._activeGroupCues.slice(groupIndex),
          { ...cue, isVisited: false, isIntersecting: true },
        ]),
      ];
      this._activeGroupCues = newActiveCues;
    }

    return this.dispatchEvent(
      new CustomEvent('cue-added', {
        detail: {},
      })
    );
  }

  removeCues(cues: Pick<Cue, 'groupId' | 'id'>[]) {
    cues.forEach(this.removeCue.bind(this));
  }

  private removeCue(cue: Pick<Cue, 'groupId' | 'id'>) {
    const { groupIndex, listIndex } = this.getCueIndexes(cue);
    if (listIndex !== -1) {
      this._cues.splice(listIndex, 1);
    }
    if (groupIndex !== -1) {
      this._activeGroupCues.splice(groupIndex, 1);
    }

    if (
      this._activeCue?.id === cue.id &&
      this._activeCue?.groupId === cue.groupId
    ) {
      this._activeCue = null;
    }

    return this.dispatchEvent(
      new CustomEvent('cue-removed', {
        detail: { cue },
      })
    );
  }

  getNextCue() {
    if (this._cues.length === 0) {
      return null;
    }

    if (!this._activeCue) {
      return this.getFirstCueFromNextGroup();
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

  markGroupAsVisited() {
    if (this._activeCue) {
      // Update in storage
      this._activeGroupCues.forEach(({ groupId, id }) => {
        this._storage.markCueAsVisited(groupId, id);
      });
    }
    this.cleanUpActiveGroup();
  }

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

  private cleanUpActiveGroup() {
    // Remove active group the cues
    this._cues = this._cues.filter(
      (x) => x.groupId !== this._activeCue?.groupId
    );
    // Reset active props
    this._activeGroupCues = [];
    this._activeCue = null;
  }

  private getNextCueFromActiveGroup() {
    const currentCueIndex = this._activeGroupCues.findIndex(
      (x) => x.id === this._activeCue?.id
    );
    // If the index is last one
    if (currentCueIndex + 1 === this._activeGroupCues.length) {
      this.cleanUpActiveGroup();
      return null;
    }

    const possibleCues = this._activeGroupCues
      .slice(currentCueIndex)
      .filter((x) => !x.isVisited && x.isIntersecting);

    if (possibleCues.length > 0) {
      this._activeCue = possibleCues[0];
      return this._activeCue;
    }

    // Reset the current group cues if nothing more is left.
    this.cleanUpActiveGroup();
    return null;
  }

  private getFirstCueFromNextGroup() {
    const nextGroup = this.getNextGroupId();
    if (!nextGroup) {
      this._activeGroupCues = [];
      this._activeCue = null;
    } else {
      const nextGroupCues = this._cues.filter(
        (x) => x.groupId === nextGroup && !x.isVisited && x.isIntersecting
      );
      this._activeGroupCues = this.sortCues(nextGroupCues);
      this._activeCue = this._activeGroupCues[0];
    }
    return this._activeCue;
  }

  private sortCues(cues: CueWithServiceProps[]) {
    // todo
    // const res = cues.sort(({ priority: first }, { priority: second }) => {
    //   if (!first || !second) {
    //     return (second ?? 0) - (first ?? 0);
    //   }

    //   return first - second;
    // });

    return cues;
  }

  private getNextGroupId() {
    // Get the next group Id
    const groups = this._cues
      .filter((x) => !x.isVisited && x.isIntersecting)
      .map((x) => x.groupId)
      .filter((v, i, a) => a.indexOf(v) === i);
    return groups[0] || null;
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
}
