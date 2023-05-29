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
  private _activeGroup: string | null = null;

  private _getCueIndex({ id, group }: Cue) {
    return this._cues.findIndex((x) => x.id === id && x.group === group);
  }

  addCue(cue: Cue) {
    if (this._getCueIndex(cue) !== -1) {
      throw new Error(
        `Guide Cue with id ${cue.id} is already registered in ${cue.group} group.`
      );
    }

    // todo: check if it has been shown before
    this._cues.push(cue);

    return this.dispatchEvent(
      new CustomEvent('cue-list-changed', {
        detail: {},
      })
    );
  }

  getNextGroup() {
    const nextGroup = this._getNextGroup();
    if (!nextGroup) {
      return null;
    }

    this._activeGroup = nextGroup;
    return this._cues.filter((x) => x.group === this._activeGroup);
  }

  getCurrentGroup() {
    return this._cues.filter((x) => x.group === this._activeGroup);
  }

  private _getNextGroup() {
    // No Cues
    if (this._cues.length === 0) {
      return null;
    }

    // First time, we start with first Cue
    if (!this._activeGroup) {
      return this._cues[0].group;
    }

    // Get the next group
    const groups = this._cues
      .map((x) => x.group)
      .filter((v, i, a) => a.indexOf(v) === i);
    const indexOfCurrentGroup = groups.findIndex(
      (x) => x === this._activeGroup
    );
    // No more next groups
    if (indexOfCurrentGroup === groups.length - 1) {
      return null;
    }
    return groups[indexOfCurrentGroup + 1];
  }
}

export const GuideCueProvider = ({
  children,
}: React.PropsWithChildren<Record<string, never>>) => {
  // todo: inject storage in service.
  const serviceRef = React.useRef(new GuideCueService());

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [cues, setCues] = React.useState<Cue[] | null>(null);

  React.useEffect(() => {
    if (currentIndex === 0) {
      setCues(serviceRef.current.getNextGroup());
    }
  }, []);

  React.useEffect(() => {
    const service = serviceRef.current;
    const listener = () => {
      setCues(service.getNextGroup());
    };
    service.addEventListener('cue-list-changed', listener);
    return () => {
      service.removeEventListener('cue-list-changed', listener);
    };
  }, [serviceRef]);

  const handleNext = React.useCallback(() => {
    if (currentIndex + 1 === cues?.length) {
      setCues(serviceRef.current.getNextGroup());
      setCurrentIndex(0);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex]);

  const handleDismiss = React.useCallback(() => {
    console.log('GuideCueProvider.handleDismiss');
  }, []);

  return (
    <GuideCueContext.Provider value={{ cueService: serviceRef.current }}>
      {cues &&
        cues.length > 0 &&
        cues.map(({ content, id, ...rest }, index) => (
          <GuideCue
            key={id}
            {...rest}
            numberOfSteps={cues.length}
            currentStep={index + 1}
            open={index === currentIndex}
            setOpen={() => handleNext()}
            onDismiss={() => handleDismiss()}
            popoverZIndex={20}
          >
            {content}
          </GuideCue>
        ))}
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
