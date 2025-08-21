import React, { useContext, forwardRef, useMemo } from 'react';
import { Link as LGLink } from '@leafygreen-ui/typography';
import LGButton, { type BaseButtonProps } from '@leafygreen-ui/button';
import LGIconButton, {
  type AccessibleIconButtonProps,
} from '@leafygreen-ui/icon-button';
import type {
  InferredPolymorphicProps,
  PolymorphicAs,
} from '@leafygreen-ui/polymorphic';

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

function extractHref<T extends Record<string, unknown>>(
  props: T
): { href: string | undefined; rest: Omit<T, 'href'> } {
  if ('href' in props && typeof props.href === 'string') {
    const { href, ...rest } = props;
    return { href, rest };
  }
  return { href: undefined, rest: props };
}

// eslint-disable-next-line react/display-name
export const Button = forwardRef(
  (
    props: InferredPolymorphicProps<'button', BaseButtonProps>,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    const { utmSource, utmMedium } = useRequiredURLSearchParams();
    const { href, rest } = extractHref(props);

    const hrefWithParams = useMemo(() => {
      if (href) {
        return urlWithUtmParams(href, { utmSource, utmMedium });
      }
      return undefined;
    }, [href, utmSource, utmMedium]);

    return <LGButton href={hrefWithParams} {...rest} ref={ref} />;
  }
) as typeof LGButton;

// eslint-disable-next-line react/display-name
export const IconButton = forwardRef(
  (
    props: InferredPolymorphicProps<'button', AccessibleIconButtonProps>,
    ref: React.ForwardedRef<HTMLAnchorElement>
  ) => {
    const { utmSource, utmMedium } = useRequiredURLSearchParams();
    const { href, rest } = extractHref(props);

    const hrefWithParams = useMemo(() => {
      if (href) {
        return urlWithUtmParams(href, { utmSource, utmMedium });
      }
      return undefined;
    }, [href, utmSource, utmMedium]);

    return <LGIconButton href={hrefWithParams} {...rest} ref={ref} />;
  }
) as typeof LGIconButton;
