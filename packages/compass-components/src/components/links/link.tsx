import React, { useContext } from 'react';
import { Link as LGLink } from '@leafygreen-ui/typography';
import LGButton from '@leafygreen-ui/button';
import LGIconButton from '@leafygreen-ui/icon-button';

type LinkContextValue = {
  utmSource?: string;
  utmMedium?: string;
};
const LinkContext = React.createContext<LinkContextValue>({});
export const LinkProvider: React.FC<LinkContextValue> = ({
  utmSource,
  utmMedium,
  children,
}) => {
  const value: LinkContextValue = {
    utmSource,
    utmMedium,
  };

  return <LinkContext.Provider value={value}>{children}</LinkContext.Provider>;
};

// exported for testing purposes only
export const EXCLUDED_MONGODB_HOSTS = [
  'compass-maps.mongodb.com',
  'evergreen.mongodb.com',
  'downloads.mongodb.com',
  'cloud.mongodb.com',
];

// exported for testing purposes only
export const urlWithUtmParams = (
  urlString: string,
  { utmSource, utmMedium }: { utmSource?: string; utmMedium?: string }
): string => {
  try {
    const url = new URL(urlString);
    const urlShouldHaveUtmParams =
      /^(.*\.)?mongodb\.com$/.test(url.hostname) &&
      !EXCLUDED_MONGODB_HOSTS.includes(url.hostname);

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

export const Link = (({
  href,
  children,
  ...rest
}: React.ComponentProps<typeof LGLink>) => {
  const { utmSource, utmMedium } = useContext(LinkContext);

  if (href) {
    href = urlWithUtmParams(href, { utmSource, utmMedium });
  }

  return (
    <LGLink href={href} {...rest}>
      {children}
    </LGLink>
  );
}) as unknown as typeof LGLink;

export const Button = (({
  href,
  children,
  ...rest
}: React.ComponentProps<typeof LGButton>) => {
  const { utmSource, utmMedium } = useContext(LinkContext);

  if (href) {
    href = urlWithUtmParams(href, { utmSource, utmMedium });
  }

  return (
    <LGButton href={href} {...rest}>
      {children}
    </LGButton>
  );
}) as unknown as typeof LGButton;

export const IconButton = (({
  href,
  children,
  ...rest
}: React.ComponentProps<typeof LGIconButton>) => {
  const { utmSource, utmMedium } = useContext(LinkContext);

  if (href) {
    href = urlWithUtmParams(href, { utmSource, utmMedium });
  }

  return (
    <LGIconButton href={href} {...rest}>
      {children}
    </LGIconButton>
  );
}) as unknown as typeof LGIconButton;
