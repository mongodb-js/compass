import React from 'react';

import Banner, {
  Variant as BannerVariant,
} from '@mongodb-js/compass-components';

import { ConfigurationParameter, State } from '../shared.types';

import {
  bannerWrapperStyles,
  boldedTextStyle,
  listStyles,
} from './StatusBanner.styles';

export const StatusBanner = ({
  state,
  appliedParameters,
  failedParameters,
}: {
  state: State;
  appliedParameters?: Array<ConfigurationParameter>;
  failedParameters?: Array<ConfigurationParameter>;
}) => {
  const clusterConfigurationBannerContent = (
    parameters?: Array<ConfigurationParameter>
  ) => {
    return (
      <ul className={listStyles}>
        {(parameters ?? []).map((param) => (
          <li key={param.key}>
            <u>{param.key}</u>: {param.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Banner
      className={bannerWrapperStyles}
      variant={
        state === State.Success ? BannerVariant.Success : BannerVariant.Danger
      }
    >
      <div>
        {state === State.Success && (
          <>
            <div className={boldedTextStyle}>
              The suggestions have been applied.
            </div>
            {clusterConfigurationBannerContent(appliedParameters)}
          </>
        )}
        {state === State.Error && (
          <>
            <div className={boldedTextStyle}>
              We ran into an error when applying the suggestion. Please manually
              try it:
            </div>
            {clusterConfigurationBannerContent(failedParameters)}
          </>
        )}
      </div>
    </Banner>
  );
};
