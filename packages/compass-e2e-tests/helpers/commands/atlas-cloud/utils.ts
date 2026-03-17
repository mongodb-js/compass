import type { CompassBrowser } from '../../compass-browser';

export async function isAtlasCloudPage(
  browser: CompassBrowser,
  cloudBaseUrl: string,
  projectId: string = ''
) {
  return (await browser.getUrl()).startsWith(`${cloudBaseUrl}/v2/${projectId}`);
}

export async function getProjectIdFromPageUrl(
  browser: CompassBrowser,
  cloudBaseUrl: string
) {
  await browser.waitUntil(() => {
    return isAtlasCloudPage(browser, cloudBaseUrl);
  });
  const [, , projectId] = new URL(await browser.getUrl()).pathname.split('/');
  return projectId;
}

export async function doCloudFetch<T = any>(
  browser: CompassBrowser,
  url: string,
  init?: Omit<RequestInit, 'body'>,
  body?:
    | { json: Record<string, unknown> | Array<unknown>; form?: never }
    | { json?: never; form: Record<string, string> }
): Promise<T> {
  return browser.execute(
    async (url, init, body) => {
      const csrfHeaders = (() => {
        const token = document.querySelector<HTMLMetaElement>(
          'meta[name=csrf-token]'
        )?.content;
        const time = document.querySelector<HTMLMetaElement>(
          'meta[name=csrf-time]'
        )?.content;
        return token && time
          ? { 'X-CSRF-Token': token, 'X-CSRF-Time': time }
          : null;
      })();
      const res = await fetch(url, {
        ...init,
        ...(body && {
          body: body.json
            ? JSON.stringify(body.json)
            : body.form
            ? new URLSearchParams(body.form)
            : '',
        }),
        headers: {
          ...csrfHeaders,
          ...(body?.json && { 'Content-Type': 'application/json' }),
          ...init?.headers,
        },
      });
      if (!res.ok) {
        const details = {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
          body: await res.text().catch(() => '<could not get response body>'),
        };
        const errorMessage = `Failed to fetch ${url}:\n\n${JSON.stringify(
          details
        )}`;

        throw new Error(errorMessage);
      }
      return res.json().catch((err) => {
        // Easier to continue here than to deal with exceptions: if something
        // really went wrong, any subsequent steps in testing will most
        // definitely fail
        console.error('Failed to parse ok response as json:', err);
        return {};
      });
    },
    url,
    init,
    body
  );
}
