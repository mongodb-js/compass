import React, { useContext, forwardRef, useMemo } from 'react';
import { Link as LGLink } from '@leafygreen-ui/typography';
import LGButton, { type ButtonProps } from '@leafygreen-ui/button';
import LGIconButton, { type IconButtonProps } from '@leafygreen-ui/icon-button';

type RequiredURLSearchParamsContextValue = {
  utmSource?: string;
  utmMedium?: string;
};
const RequiredURLSearchParamsContext =
  React.createContext<RequiredURLSearchParamsContextValue>({});
export const RequiredURLSearchParamsProvider: React.FC<
  RequiredURLSearchParamsContextValue
> = ({ utmSource, utmMedium, children }) => {
  const value: RequiredURLSearchParamsContextValue = {
    utmSource,
    utmMedium,
  };

  return (
    <RequiredURLSearchParamsContext.Provider value={value}>
      {children}
    </RequiredURLSearchParamsContext.Provider>
  );
};

export const urlWithUtmParams = (
  urlString: string,
  { utmSource, utmMedium }: { utmSource?: string; utmMedium?: string }
): string => {
  try {
    const url = new URL(urlString);
    const urlShouldHaveUtmParams = /^(.*\.)?mongodb\.com$/.test(url.hostname);

    if (urlShouldHaveUtmParams) {
      if (utmSource && !url.searchParams.has('utm_source')) {
        url.searchParams.set('utm_source', utmSource);
      }
      if (utmMedium && !url.searchParams.has('utm_medium')) {
        url.searchParams.set('utm_medium', utmMedium);
      }
    }
    return url.toString();
  } catch {
    return urlString;
  }
};

export function useRequiredURLSearchParams(): RequiredURLSearchParamsContextValue {
  return useContext(RequiredURLSearchParamsContext);
}

// NB: leafygreen Link component type is written in a way that doesn't allow us
// to derive the component props at all. Not much we can do here, but just
// define some of the ones we care about
type LeafygreenLinkProps = { href: string; children: React.ReactNode };

export const Link = (({ href, children, ...rest }: LeafygreenLinkProps) => {
  const { utmSource, utmMedium } = useRequiredURLSearchParams();

  const hrefWithParams = useMemo(() => {
    if (href) {
      return urlWithUtmParams(href, { utmSource, utmMedium });
    }
    return undefined;
  }, [href, utmSource, utmMedium]);

  return (
    <LGLink href={hrefWithParams} {...rest}>
      {children}
    </LGLink>
  );
}) as unknown as typeof LGLink;

// eslint-disable-next-line react/display-name
export const Button = forwardRef(
  (
    { children, ...props }: ButtonProps,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    const { utmSource, utmMedium } = useRequiredURLSearchParams();

    const hrefWithParams = useMemo(() => {
      if ('href' in props && props.href) {
        return urlWithUtmParams(props.href, { utmSource, utmMedium });
      }
      return undefined;
    }, [props, utmSource, utmMedium]);

    return (
      <LGButton {...props} href={hrefWithParams} ref={ref}>
        {children}
      </LGButton>
    );
  }
) as unknown as typeof LGButton;

// eslint-disable-next-line react/display-name
export const IconButton = forwardRef(
  (
    { children, ...props }: IconButtonProps,
    ref: React.ForwardedRef<HTMLAnchorElement>
  ) => {
    const { utmSource, utmMedium } = useRequiredURLSearchParams();

    const hrefWithParams = useMemo(() => {
      if ('href' in props && props.href) {
        return urlWithUtmParams(props.href, { utmSource, utmMedium });
      }
      return undefined;
    }, [props, utmSource, utmMedium]);

    return (
      <LGIconButton href={hrefWithParams} {...props} ref={ref}>
        {children}
      </LGIconButton>
    );
  }
) as unknown as typeof LGIconButton;
