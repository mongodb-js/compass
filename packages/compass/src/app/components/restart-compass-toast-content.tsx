import {
  Button,
  ButtonVariant,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  div: {
    display: 'flex',
    flexDirection: 'column',
    margin: 'auto',
    padding: spacing[1],
  },
});

export const RestartCompassToastContent = ({
  onUpdateClicked,
}: {
  onUpdateClicked: () => void;
}) => {
  return (
    <div className={containerStyles}>
      <div>
        Continuing to use Compass without restarting may cause some of the
        features to not work as intended.
      </div>
      <div>
        <Button variant={ButtonVariant.Primary} onClick={onUpdateClicked}>
          Restart
        </Button>
      </div>
    </div>
  );
};
