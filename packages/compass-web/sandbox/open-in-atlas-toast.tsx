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
          <p>
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
          </p>
        </li>
        <li>
          <p>
            Import configuration file from{' '}
            <code>
              packages/compass-web/scripts/redirect-extension-config.json
            </code>{' '}
            (redirects will be enabled by default)
          </p>
        </li>
        <li>
          <p>Navigate to Atlas Cloud environment of choice</p>
          <p>
            If everything was configured correctly, you should see a commit hash
            in the Compass sidebar header that would not be visible otherwise
          </p>
        </li>
        <li>
          <p>
            When you are done with testing, disable the redirects from the
            extension UI
          </p>
        </li>
      </ol>
    </>
  );
}

const IS_E2E = process.env.APP_ENV === 'webdriverio';

function showOpenInAtlasToast() {
  if (IS_E2E) {
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
              hideCancelButton: true,
              confirmButtonProps: {
                children: 'OK',
              },
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
