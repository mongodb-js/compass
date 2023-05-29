import React from 'react';
import { GuideCue } from '@mongodb-js/compass-components';

type Cue = {
  id: string;
  title: string;
  group: string;
  content: React.ReactNode;
  refEl: React.RefObject<HTMLElement>;
};

const GUIDE_CUE_LOCAL_DATA: Record<string, any> = {};
interface GuideCueStorage {
  isCueVisited: (group: string, id: string) => boolean;
  markCueAsVisited: (group: string, id: string) => void;
}
export class CompassGuideCueStorage implements GuideCueStorage {
  isCueVisited(group: string, id: string) {
    return !!GUIDE_CUE_LOCAL_DATA[group]?.[id];
  }
  markCueAsVisited(group: string, id: string) {
    GUIDE_CUE_LOCAL_DATA[group][id] = {
      showAt: new Date().getTime(),
    };
  }
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

class GuideCueGroupManager {
  private _currentCueIndex: number | null = null;
  private _groupTitle: string | null = null;

  constructor(cues: Cue[]) {}
}

class GuideCueService extends EventTarget {
  private _cues: Array<Cue> = [];
  private _activeGroup: string | null = null;

  private _getCueIndex(cue: Cue) {
    return this._cues.findIndex(
      (x) => x.id === cue.id && x.group === cue.group
    );
  }

  private _onCueListChanged() {
    // console.log('GuideCueProvider.onCueListChanged', this);
    const list = this._cues;
    if (list.length === 0) {
      return;
    }
    return this.dispatchEvent(
      new CustomEvent('cue-list-changed', {
        detail: {},
      })
    );
  }

  addCue(cue: Cue) {
    if (this._getCueIndex(cue) > -1) {
      return false;
    }
    // todo: check if it has been shown before
    this._cues.push(cue);
    return this._onCueListChanged();
  }

  updateCue(cue: Cue) {
    const index = this._getCueIndex(cue);
    if (index === -1) {
      return false;
    }
    this._cues[index] = cue;
    return this._onCueListChanged();
  }

  getNextGroup() {
    if (this._cues.length === 0) {
      return null;
    }

    if (!this._activeGroup) {
      this._activeGroup = this._cues[0].group;
    } else {
      const groups = this._cues
        .map((x) => x.group)
        .filter((v, i, a) => a.indexOf(v) !== i);
      const indexOfCurrentGroup = groups.findIndex(
        (x) => x === this._activeGroup
      );
      if (indexOfCurrentGroup === groups.length + 1) {
        return null;
      }
      this._activeGroup = groups[indexOfCurrentGroup + 1];
    }

    return this._cues.filter((x) => x.group === this._activeGroup);
  }
}

type GuideCueProps = Omit<React.ComponentProps<typeof GuideCue>, 'setOpen'>;
export const GuideCueProvider = ({
  children,
}: React.PropsWithChildren<Record<string, never>>) => {
  const serviceRef = React.useRef(new GuideCueService());

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [cues, setCues] = React.useState<Cue[] | null>(null);

  React.useEffect(() => {
    setCues(serviceRef.current.getNextGroup());
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
            children={content}
          />
        ))}
      {children}
    </GuideCueContext.Provider>
  );
};

export const useGuideCue = (
  cue: Cue,
  deps: React.DependencyList | undefined
) => {
  const context = React.useContext(GuideCueContext);
  if (!context) {
    throw new Error('useGuideCue can only be used inside GuideCueContext');
  }
  React.useEffect(() => {
    context.cueService.updateCue(cue);
  }, deps);

  context.cueService.addCue(cue);
};
