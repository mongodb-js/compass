import React from 'react';
import {
  Icon,
  Body,
  Button,
  ButtonVariant,
  spacing,
  css,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';

const confirmationMessageStyles = css({
  padding: spacing[300],
  borderRadius: spacing[200],
  backgroundColor: palette.gray.light3,
  border: `1px solid ${palette.gray.light2}`,
});

const confirmationStatusStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  marginTop: spacing[200],
});

const confirmationStatusTextStyles = css({
  color: palette.gray.dark1,
});

const confirmationTitleStyles = css({
  marginBottom: spacing[150],
  fontWeight: 600,
});

const buttonGroupStyles = css({
  display: 'flex',
  gap: spacing[200],
  marginTop: spacing[300],
  '> button': {
    width: '100%',
  },
});

interface ConfirmationMessageProps {
  state: 'confirmed' | 'rejected' | 'pending';
  title: string;
  description: string;
  onConfirm: () => void;
  onReject: () => void;
}

export const ConfirmationMessage: React.FunctionComponent<
  ConfirmationMessageProps
> = ({ state, title, description, onConfirm, onReject }) => {
  const darkMode = useDarkMode();

  return (
    <div
      className={confirmationMessageStyles}
      style={{
        backgroundColor: darkMode ? palette.gray.dark3 : palette.gray.light3,
        borderColor: darkMode ? palette.gray.dark2 : palette.gray.light2,
      }}
    >
      <Body className={confirmationTitleStyles}>{title}</Body>

      <Body>{description}</Body>

      {state === 'pending' && (
        <div className={buttonGroupStyles}>
          <Button
            variant={ButtonVariant.Default}
            onClick={onReject}
            size="default"
          >
            Cancel
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            onClick={onConfirm}
            size="default"
          >
            Confirm
          </Button>
        </div>
      )}
      {state !== 'pending' && (
        <div className={confirmationStatusStyles}>
          <Icon
            glyph={
              state === 'confirmed' ? 'CheckmarkWithCircle' : 'XWithCircle'
            }
            color={palette.gray.dark1}
          />
          <Body className={confirmationStatusTextStyles} weight="medium">
            Request {state === 'confirmed' ? 'confirmed' : 'cancelled'}
          </Body>
        </div>
      )}
    </div>
  );
};
