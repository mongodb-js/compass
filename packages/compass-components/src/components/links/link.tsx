import React, { useContext } from 'react';
import { Link as LGLink } from '@leafygreen-ui/typography';

type LinkContextValue = {
  utmSource?: string;
  utmMedium?: string;
};
const LinkContext = React.createContext<LinkContextValue>({});
export const LinkProvider: React.FC<LinkContextValue> = ({ children }) => {
  const value: LinkContextValue = {};

  return <LinkContext.Provider value={value}>{children}</LinkContext.Provider>;
};

export const EXCLUDED_MONGODB_HOSTS = [
  'compass-maps.mongodb.com',
  'evergreen.mongodb.com',
  'downloads.mongodb.com',
  'cloud.mongodb.com',
];

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
      if (utmSource) {
        url.searchParams.set('utm_source', utmSource);
      }
      if (utmMedium) {
        url.searchParams.set('utm_medium', utmMedium);
      }
    }
    return url.toString();
  } catch {
    return urlString;
  }
};

//type LGLinkType = typeof LGLink & {
//  href?: string,
//  children: React.ReactNode
//};

type LGLinkType = React.ComponentProps<typeof LGLink>;

export const Link = ({ href, children, ...rest }: LGLinkType) => {
  const { utmSource, utmMedium } = useContext(LinkContext);

  if (href) {
    href = urlWithUtmParams(href, { utmSource, utmMedium });
  }

  return (
    <LGLink href={href} {...rest}>
      {children}
    </LGLink>
  );
};
