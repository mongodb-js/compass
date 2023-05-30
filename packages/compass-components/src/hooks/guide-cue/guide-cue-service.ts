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
  isNotIntersecting: boolean;
};

export class GuideCueService extends EventTarget {
  private _cues: Array<CueWithServiceProps> = [];
  private _activeGroupCues: Array<CueWithServiceProps> = [];
  private _activeCue: CueWithServiceProps | null = null;

  get numOfCuesInGroup() {
    return this._activeGroupCues.length;
  }

  get currentCueIndex() {
    return this._activeGroupCues.findIndex((x) => x.id === this._activeCue?.id);
  }

  addCue(cue: Cue) {
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

    // todo: storage - check if this cue has been shown

    this._cues.push({ ...cue, isVisited: false, isNotIntersecting: false });

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

  removeCue(cue: Pick<Cue, 'group' | 'id'>) {}

  getNextCue() {
    if (this._cues.length === 0) {
      return null;
    }

    // First time, when nothing is shown yet.
    // todo: extract to a method
    if (!this._activeCue) {
      this._activeCue = this._cues.find((x) => !x.isVisited) ?? null;
      this._activeGroupCues = this._cues.filter(
        (x) => x.group === this._activeCue?.group
      );
      return this._activeCue;
    }

    // If the current cue is not last, then show next cue.
    const nextPossibleCue = this.getNextCueFromActiveGroup();
    if (nextPossibleCue) {
      return nextPossibleCue;
    }

    // Get the next group
    return this.getFirstCueFromNextGroup();
  }

  private getNextGroup() {
    // Get the next group
    const groups = this._cues
      .filter((x) => !x.isVisited)
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
      .filter((x) => !x.isVisited);

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
      this._activeGroupCues = this._cues.filter((x) => x.group === nextGroup);
      this._activeCue = this._activeGroupCues[0];
    }
    return this._activeCue;
  }

  markCueAsNotIntersecting(cue: Cue) {
    const cueIndex = this._cues.findIndex(
      (x) => x.id === cue.id && x.group === cue.group
    );
    this._cues[cueIndex].isNotIntersecting = true;

    const activeCueIndex = this._activeGroupCues.findIndex(
      (x) => x.id === cue.id && x.group === cue.group
    );
    this._cues[activeCueIndex].isNotIntersecting = true;
  }

  markCueAsVisited(cue: Cue) {
    const cueIndex = this._cues.findIndex(
      (x) => x.id === cue.id && x.group === cue.group
    );
    this._cues[cueIndex].isVisited = true;

    const activeCueIndex = this._activeGroupCues.findIndex(
      (x) => x.id === cue.id && x.group === cue.group
    );
    this._activeGroupCues[activeCueIndex].isVisited = true;
    // todo: storage - mark cue as visited
  }

  markGroupAsVisited(group: string) {
    this._cues = this._cues.filter((x) => x.group !== group);
    // todo: storage - mark all the cues as visited
  }
}
