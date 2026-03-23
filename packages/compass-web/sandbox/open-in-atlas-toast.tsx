import React, { useEffect } from 'react';
import {
  Link,
  css,
  openToast,
  showConfirmation,
  spacing,
} from '@mongodb-js/compass-components';

const listStyles = css({
  listStyle: 'decimal',
  marginLeft: spacing[500],
  '& > li': {
    marginTop: spacing[100],
  },
});

function Instructions() {
  return (
    <>
      <p>
        By going through the following steps you can embed your local build of
        compass-web in any Atlas Cloud environment of your choice for testing
        purposes:
      </p>
      <ol className={listStyles}>
        <li>
          Install &quot;Header Editor Lite&quot; browser extension (
          <Link
            href="https://chromewebstore.google.com/detail/header-editor-lite/eningockdidmgiojffjmkdblpjocbhgh"
            target="_blank"
          >
            Chrome
          </Link>
          &nbsp;|&nbsp;
          <Link
            href="https://addons.mozilla.org/en-US/firefox/addon/header-editor-lite/"
            target="_blank"
          >
            Firefox
          </Link>
          )
        </li>
        <li>
          Import configuration file from{' '}
          <code>
            packages/compass-web/scripts/redirect-extension-config.json
          </code>{' '}
          (redirects will be enabled by default)
        </li>
        <li>Navigate to Atlas Cloud environment of choice</li>
        <li>
          When you are done with testing, disable the redirects from the
          extension UI
        </li>
      </ol>
    </>
  );
}

// TODO: needs process polyfill here too
const IS_CI = false;
// process.env.ci ||
// process.env.CI ||
// process.env.IS_CI ||
// process.env.NODE_ENV === 'test' ||
// process.env.APP_ENV === 'webdriverio';

function showOpenInAtlasToast() {
  if (IS_CI) {
    return;
  }

  openToast('open-in-atlas', {
    title: (
      <>
        Open local compass-web{' '}
        <Link
          as="button"
          onClick={() => {
            void showConfirmation({
              title: 'Test local compass-web in Atlas Cloud environment',
              description: <Instructions></Instructions>,
            });
          }}
        >
          in Atlas Cloud
        </Link>
      </>
    ),
  });
}

export function OpenInAtlasToast() {
  useEffect(() => {
    showOpenInAtlasToast();
  }, []);
  return null;
}
