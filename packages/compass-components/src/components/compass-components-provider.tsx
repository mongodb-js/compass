import React, { useEffect, useMemo, useState } from 'react';
import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';
import { ConfirmationModalArea } from '../hooks/use-confirmation';
import { ToastArea } from '../hooks/use-toast';
import { GuideCueProvider } from './guide-cue/guide-cue';
import { SignalHooksProvider } from './signal-popover';

type GuideCueProviderProps = React.ComponentProps<typeof GuideCueProvider>;

type CompassComponentsProviderProps = {
  /**
   * Dark mode to be passed to the leafygreen provider. If not provided, the
   * value will be derived from the system settings
   */
  darkMode?: boolean;
  /**
   * Either React children or a render callback that will get the darkMode
   * property passed as function properties
   */
  children?:
    | React.ReactNode
    | (({
        darkMode,
      }: {
        darkMode: boolean;
        portalContainerRef: React.Ref<HTMLElement>;
        scrollContainerRef: React.Ref<HTMLElement>;
      }) => React.ReactElement | null);
} & {
  onNextGuideGue?: GuideCueProviderProps['onNext'];
  onNextGuideCueGroup?: GuideCueProviderProps['onNextGroup'];
} & React.ComponentProps<typeof SignalHooksProvider>;

const darkModeMediaQuery = (() => {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : // A fallback for test environment. This API is supported in browsers
      // since forever, so there is no way this will be missing in a real
      // browser / electron env
      {
        matches: false,
        addEventListener() {
          // noop
        },
        removeEventListener() {
          // noop
        },
      };
})();

function useDarkMode(_darkMode?: boolean) {
  const isDarkModeControlled = typeof _darkMode !== 'undefined';
  const [darkMode, setDarkMode] = useState(
    _darkMode ?? darkModeMediaQuery.matches
  );
  useEffect(() => {
    const onDarkModeMediaQueryChange = () => {
      setDarkMode(darkModeMediaQuery.matches);
    };
    darkModeMediaQuery.addEventListener('change', onDarkModeMediaQueryChange);
    return () => {
      darkModeMediaQuery.removeEventListener(
        'change',
        onDarkModeMediaQueryChange
      );
    };
  }, []);
  return isDarkModeControlled ? _darkMode : darkMode;
}

/**
 * This component combines most of the existing compass-component providers into
 * one for the purposes of being reused between compass-main (electron) and
 * compass-web. This component ONLY combines UI-related providers exported from
 * the compass-components plugin and is not intended to include all the various
 * other providers we use in the app that usually have a platform specific role
 * (like WorkspacesProviders or FileInputBackendProvider).
 *
 * A rule of thumb for adding a new provider in this component tree should be
 * whether or not it can be used completely interchangeably between electron and
 * browser environment.
 */
export const CompassComponentsProvider = ({
  darkMode: _darkMode,
  children,
  onNextGuideGue,
  onNextGuideCueGroup,
  ...signalHooksProviderProps
}: CompassComponentsProviderProps) => {
  const darkMode = useDarkMode(_darkMode);

  // Leafygreen doesn't accept refs for dom elements so we are required to
  // trigger a state update when the popover ref is resolved. This is very
  // pricey operation as this re-renders the whole application tree, but there
  // is literally no way around it with how leafygreen popover works and lucky
  // for us, this will usually cause a state update only once
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(
    null
  );

  const popoverPortalContainer = useMemo(() => {
    return { portalContainer, scrollContainer };
  }, [portalContainer, scrollContainer]);

  return (
    <LeafyGreenProvider
      darkMode={darkMode}
      popoverPortalContainer={popoverPortalContainer}
    >
      <GuideCueProvider
        onNext={onNextGuideGue}
        onNextGroup={onNextGuideCueGroup}
      >
        <SignalHooksProvider {...signalHooksProviderProps}>
          <ConfirmationModalArea>
            <ToastArea>
              {typeof children === 'function'
                ? children({
                    darkMode,
                    portalContainerRef: setPortalContainer,
                    scrollContainerRef: setScrollContainer,
                  })
                : children}
            </ToastArea>
          </ConfirmationModalArea>
        </SignalHooksProvider>
      </GuideCueProvider>
    </LeafyGreenProvider>
  );
};
