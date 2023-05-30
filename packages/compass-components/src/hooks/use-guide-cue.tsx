import React from 'react';
import { GuideCue } from '..';

type Cue = {
  id: string;
  title: string;
  group: string;
  content: React.ReactNode;
  refEl: React.RefObject<HTMLElement>;
};

export interface GuideCueStorage {
  isCueVisited: (group: string, id: string) => boolean;
  markCueAsVisited: (group: string, id: string) => void;
}

const GuideCueContext = React.createContext<
  | {
      cueService: GuideCueService;
    }
  | undefined
>(undefined);

interface GuideCueEventMap {
  'cue-list-changed': CustomEvent;
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

class GuideCueService extends EventTarget {
  private _cues: Array<Cue> = [];
  private _activeGroupCues: Array<Cue> = [];
  private _activeCue: Cue | null = null;
  private _visitedGroups: string[] = [];

  get numOfCuesInGroup() {
    return this._activeGroupCues.length;
  }

  get currentCueIndex() {
    return this._activeGroupCues.findIndex((x) => x.id === this._activeCue?.id);
  }

  addCue(cue: Cue) {
    if (
      this._cues.find(({ id, group }) => id === cue.id && group === cue.group)
    ) {
      throw new Error(
        `Guide Cue with id ${cue.id} is already registered in ${cue.group} group.`
      );
    }

    // todo: storage - check if this cue has been shown

    this._cues.push(cue);

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

  getNextCue() {
    if (this._cues.length === 0) {
      return null;
    }

    // todo: storage - mark current cue as visited

    // First time, when nothing is shown yet.
    // todo: extract to a method
    if (!this._activeCue && this._visitedGroups.length === 0) {
      this._activeCue = this._cues[0];
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
      .map((x) => x.group)
      .filter((v, i, a) => a.indexOf(v) === i);
    const currentGroupIndex = groups.findIndex(
      (x) => x === this._activeCue?.group
    );
    return groups[currentGroupIndex + 1] || null;
  }

  private getNextCueFromActiveGroup() {
    const currentCueIndex = this._activeGroupCues.findIndex(
      (x) => x.id === this._activeCue?.id
    );
    // If the index is last one
    if (currentCueIndex + 1 === this._activeGroupCues.length) {
      return null;
    }
    this._activeCue = this._activeGroupCues[currentCueIndex + 1];
    return this._activeCue;
  }

  getFirstCueFromNextGroup() {
    const nextGroup = this.getNextGroup();
    if (this._activeCue) {
      this._visitedGroups.push(this._activeCue.group);
    }
    if (!nextGroup) {
      this._activeGroupCues = [];
      this._activeCue = null;
    } else {
      this._activeGroupCues = this._cues.filter((x) => x.group === nextGroup);
      this._activeCue = this._activeGroupCues[0];
    }
    return this._activeCue;
  }
}

export const GuideCueProvider = ({
  children,
}: React.PropsWithChildren<Record<string, never>>) => {
  // todo: inject storage in service.
  const serviceRef = React.useRef(new GuideCueService());

  const [cue, setCue] = React.useState<Cue | null>(null);

  React.useEffect(() => {
    setCue(serviceRef.current.getNextCue());
  }, []);

  React.useEffect(() => {
    const service = serviceRef.current;
    const listener = () => {
      if (cue) {
        return;
      }
      setCue(serviceRef.current.getNextCue());
    };
    service.addEventListener('cue-list-changed', listener);
    return () => {
      service.removeEventListener('cue-list-changed', listener);
    };
  }, [serviceRef, setCue, cue]);

  const onNext = () => {
    // todo: fix
    setCue(null);
    setCue(serviceRef.current.getNextCue());
  };

  const onNextGroup = () => {
    // todo: fix
    setCue(null);
    setCue(serviceRef.current.getFirstCueFromNextGroup());
  };

  return (
    <GuideCueContext.Provider value={{ cueService: serviceRef.current }}>
      {cue && (
        <GuideCue
          title={cue.title}
          refEl={cue.refEl}
          numberOfSteps={serviceRef.current.numOfCuesInGroup}
          currentStep={serviceRef.current.currentCueIndex + 1}
          open={true}
          setOpen={() => {}}
          onDismiss={() => onNextGroup()}
          onPrimaryButtonClick={() => onNext()}
        >
          {cue.content}
        </GuideCue>
      )}
      {children}
    </GuideCueContext.Provider>
  );
};

type GuideCueProps = {
  id: string;
  title: string;
  group: string;
  content: React.ReactNode;
};
export const useGuideCue = (cue: GuideCueProps) => {
  const context = React.useContext(GuideCueContext);
  const refEl = React.useRef<HTMLElement | null>(null);
  if (!context) {
    throw new Error('useGuideCue can only be used inside GuideCueContext');
  }
  React.useEffect(() => {
    if (refEl.current) {
      context.cueService.addCue({ ...cue, refEl });
    }
  }, [refEl]);

  return {
    refEl,
  };
};
