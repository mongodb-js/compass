import React from 'react';
import SettingsList from './settings-list';

const tuningFields = ['longValuesInDataDisplay'] as const;

export const TuningSettings: React.FunctionComponent = () => {
  return (
    <div data-testid="tuning-settings">
      <div>
        Custom tweaks for this Compass build. These options change how Compass
        displays your data.
      </div>
      <SettingsList fields={tuningFields} />
    </div>
  );
};

export default TuningSettings;
