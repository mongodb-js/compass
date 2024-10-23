import {
  Banner,
  Description,
  FormFieldContainer,
  Label,
  TextInput,
} from '@mongodb-js/compass-components';
import type { DevtoolsProxyOptions } from 'compass-preferences-model';
import type { ChangeEvent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';

function errorToString(err: unknown): string {
  return err && typeof err === 'object' && 'message' in err
    ? String(err.message)
    : String(err);
}

type CustomProxyOptions = {
  proxyUrl: string;
  proxyUrlState: 'none' | 'error';
  proxyUrlErrorMessage?: string | undefined;
  proxyUsername: string;
  proxyPassword: string;
};

function customProxyOptionsForFullURL(
  url: string | undefined
): CustomProxyOptions {
  try {
    const parsed = url
      ? new URL(url)
      : { username: '', password: '', href: '' };
    const { username, password } = parsed;
    parsed.username = '';
    parsed.password = '';

    return {
      proxyUrl: parsed.href,
      proxyUrlState: 'none',
      proxyUrlErrorMessage: undefined,
      proxyUsername: username,
      proxyPassword: password,
    };
  } catch (err) {
    return {
      proxyUrl: url || '',
      proxyUrlState: 'error',
      proxyUrlErrorMessage: errorToString(err),
      proxyUsername: '',
      proxyPassword: '',
    };
  }
}

function fullURLForCustomProxyOptions(options: CustomProxyOptions): string {
  if (!options.proxyUrl) return '';
  const reassembled = new URL(options.proxyUrl);
  reassembled.username = options.proxyUsername;
  reassembled.password = options.proxyPassword;
  return reassembled.href;
}

export interface ProxySettingsCustomProps {
  disabled: boolean;
  proxyOptions: DevtoolsProxyOptions;
  setProxyOptions: (proxyOptions: DevtoolsProxyOptions) => void;
}

export const ProxySettingsCustom: React.FunctionComponent<
  ProxySettingsCustomProps
> = ({ disabled, proxyOptions, setProxyOptions }) => {
  // Sync between the external (settings) state containing just a URL
  // to represent these options, and the component-internal state
  // that uses different fields to represent the different part of the URL.
  const [customProxyOptions, _setCustomProxyOptions] = useState(
    customProxyOptionsForFullURL(proxyOptions.proxy)
  );
  useEffect(() => {
    if (
      !proxyOptions.proxy ||
      fullURLForCustomProxyOptions(customProxyOptions) !== proxyOptions.proxy
    ) {
      _setCustomProxyOptions(customProxyOptionsForFullURL(proxyOptions.proxy));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proxyOptions.proxy]);

  const setCustomProxyOptions = useCallback(
    (update: Partial<CustomProxyOptions>, isURLAuthUpdate: boolean) => {
      const newOptions = { ...customProxyOptions, ...update };
      if (!isURLAuthUpdate) {
        try {
          const url = new URL(newOptions.proxyUrl);
          if (url.username || url.password) {
            newOptions.proxyUsername = decodeURIComponent(url.username);
            newOptions.proxyPassword = decodeURIComponent(url.password);
          }
        } catch {
          // Not a valid URL yet
        }
      }
      try {
        const newFullURL = fullURLForCustomProxyOptions(newOptions);
        const roundtripped = customProxyOptionsForFullURL(newFullURL);
        if (isURLAuthUpdate) {
          newOptions.proxyUrl = roundtripped.proxyUrl;
        }
        setProxyOptions({ ...proxyOptions, proxy: newFullURL });
      } catch (err) {
        _setCustomProxyOptions({
          ...newOptions,
          proxyUrlState: 'error',
          proxyUrlErrorMessage: errorToString(err),
        });
        return;
      }
      _setCustomProxyOptions({
        ...newOptions,
        proxyUrlState: 'none',
        proxyUrlErrorMessage: '',
      });
    },
    [customProxyOptions, proxyOptions, setProxyOptions, _setCustomProxyOptions]
  );

  const {
    proxyUrl,
    proxyUrlState,
    proxyUrlErrorMessage,
    proxyUsername,
    proxyPassword,
  } = customProxyOptions;
  const setProxyUrl = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) =>
      setCustomProxyOptions({ proxyUrl: ev.target.value.trim() }, false),
    [setCustomProxyOptions]
  );
  const setProxyUsername = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) =>
      setCustomProxyOptions({ proxyUsername: ev.target.value }, true),
    [setCustomProxyOptions]
  );
  const setProxyPassword = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) =>
      setCustomProxyOptions({ proxyPassword: ev.target.value }, true),
    [setCustomProxyOptions]
  );

  return (
    <div data-testid="proxy-settings-custom">
      <FormFieldContainer>
        <Label htmlFor="proxy-url" id="proxy-url-label">
          Proxy URL
        </Label>
        <Description>
          Specify a <code>http://</code>, <code>https://</code>,{' '}
          <code>socks5://</code>
          or <code>pac+https://</code> URL.
        </Description>
        <TextInput
          id="proxy-url"
          data-testid="proxy-url"
          aria-labelledby="proxy-url-label"
          onChange={setProxyUrl}
          value={proxyUrl}
          disabled={disabled}
          state={proxyUrlState}
          errorMessage={proxyUrlErrorMessage}
          placeholder="https://example.com:8080"
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label htmlFor="proxy-username" id="proxy-username-label">
          Username
        </Label>
        <TextInput
          id="proxy-username"
          data-testid="proxy-username"
          aria-labelledby="proxy-username-label"
          onChange={setProxyUsername}
          value={proxyUsername}
          optional
          disabled={disabled}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label htmlFor="proxy-password" id="proxy-password-label">
          Password
        </Label>
        <TextInput
          type="password"
          id="proxy-password"
          data-testid="proxy-password"
          aria-labelledby="proxy-password-label"
          onChange={setProxyPassword}
          value={proxyPassword}
          optional
          disabled={disabled}
        />
      </FormFieldContainer>
      {(proxyPassword || proxyUsername) && (
        <Banner variant="warning">
          Some resources, such as map data for geographic visualizations, cannot
          currently be loaded through proxies which require authentication.
        </Banner>
      )}
    </div>
  );
};
