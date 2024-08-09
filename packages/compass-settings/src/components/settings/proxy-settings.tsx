import type { ChangeEvent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { changeFieldValue } from '../../stores/settings';
import type { RootState } from '../../stores';
import type {
  PreferenceStateInformation,
  DevtoolsProxyOptions,
} from 'compass-preferences-model';
import {
  proxyOptionsToProxyPreference,
  proxyPreferenceToProxyOptions,
} from 'compass-preferences-model/provider';
import { connect } from 'react-redux';
import {
  Description,
  FormFieldContainer,
  Label,
  RadioBox,
  RadioBoxGroup,
  TextInput,
} from '@mongodb-js/compass-components';
import { settingStateLabels } from './state-labels';
import { ProxySettingsCustom } from './proxy-settings-custom';

interface ProxySettingsProps {
  onChange: (key: 'proxy', value: string) => void;
  proxy: string;
  proxySettingsState: PreferenceStateInformation['proxy'];
}

type ProxyType = 'custom' | 'env' | 'no-proxy';

const UnconnectedProxySettings: React.FunctionComponent<ProxySettingsProps> = ({
  onChange,
  proxy,
  proxySettingsState,
}) => {
  const [proxyOptions] = useMemo(() => {
    const proxyOptions = proxyPreferenceToProxyOptions(proxy);
    return [proxyOptions];
  }, [proxy]);

  const setProxyOptions = useCallback(
    (options: DevtoolsProxyOptions) => {
      onChange('proxy', proxyOptionsToProxyPreference(options));
    },
    [onChange]
  );

  const disabled = !!proxySettingsState;
  const stateLabel = settingStateLabels[proxySettingsState ?? ''];

  const proxyType: ProxyType =
    typeof proxyOptions.proxy === 'string'
      ? 'custom'
      : proxyOptions.useEnvironmentVariableProxies
      ? 'env'
      : 'no-proxy';
  const setProxyType = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const type = ev.target.value as ProxyType;
      const update: Record<ProxyType, Partial<DevtoolsProxyOptions>> = {
        env: {
          proxy: undefined,
          useEnvironmentVariableProxies: true,
        },
        'no-proxy': {
          proxy: undefined,
          useEnvironmentVariableProxies: false,
        },
        custom: {
          proxy: '',
          useEnvironmentVariableProxies: true,
        },
      };
      setProxyOptions({ ...proxyOptions, ...update[type] });
    },
    [proxyOptions, setProxyOptions]
  );

  const noProxyHosts = proxyOptions.noProxyHosts;
  const setNoProxyHosts = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      setProxyOptions({ ...proxyOptions, noProxyHosts: ev.target.value });
    },
    [proxyOptions, setProxyOptions]
  );

  return (
    <div data-testid="proxy-settings">
      <FormFieldContainer>
        <RadioBoxGroup onChange={setProxyType} value={proxyType}>
          <RadioBox
            value="no-proxy"
            disabled={disabled}
            data-testid="no-proxy-radio"
          >
            No Proxy
          </RadioBox>
          <RadioBox value="env" disabled={disabled} data-testid="env-radio">
            System Proxy
          </RadioBox>
          <RadioBox
            value="custom"
            disabled={disabled}
            data-testid="custom-radio"
          >
            Manual Configuration
          </RadioBox>
        </RadioBoxGroup>
      </FormFieldContainer>
      {proxyType === 'custom' && (
        <ProxySettingsCustom
          disabled={disabled}
          proxyOptions={proxyOptions}
          setProxyOptions={setProxyOptions}
        />
      )}
      {(proxyType === 'env' || proxyType === 'custom') && (
        <FormFieldContainer>
          <Label htmlFor="proxy-no-proxy-hosts" id="proxy-no-proxy-hosts-label">
            Excluded hosts
          </Label>
          <Description>
            Comma-separated list of hostnames and IP addresses. Connections to
            these hosts will not be forwarded through the proxy.
          </Description>
          <TextInput
            id="proxy-no-proxy-hosts"
            data-testid="proxy-no-proxy-hosts"
            aria-labelledby="proxy-no-proxy-hosts-label"
            onChange={setNoProxyHosts}
            value={noProxyHosts}
            optional
            disabled={disabled}
          />
        </FormFieldContainer>
      )}
      {stateLabel}
    </div>
  );
};

export const ProxySettings = connect(
  (state: RootState) => {
    const {
      settings: { settings, preferenceStates },
    } = state;

    return {
      proxy: settings.proxy,
      proxySettingsState: preferenceStates.proxy,
    };
  },
  { onChange: changeFieldValue }
)(UnconnectedProxySettings);
