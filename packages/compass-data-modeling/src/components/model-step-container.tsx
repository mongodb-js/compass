import React from 'react';
import {
  Body,
  Button,
  css,
  ModalBody,
  ModalFooter,
  ModalHeader,
  spacing,
  SpinLoader,
} from '@mongodb-js/compass-components';

const footerStyles = css({
  flexDirection: 'row',
  alignItems: 'center',
});
const footerTextStyles = css({ marginRight: 'auto' });
const footerActionsStyles = css({ display: 'flex', gap: spacing[200] });

export const ModalStepContainer: React.FunctionComponent<{
  title: string;
  description?: string;
  onNextClick: () => void;
  onPreviousClick: () => void;
  isNextDisabled: boolean;
  isLoading?: boolean;
  nextLabel: string;
  previousLabel: string;
  step: string;
  footerText?: React.ReactNode;
}> = ({
  title,
  description,
  onPreviousClick,
  onNextClick,
  isNextDisabled,
  nextLabel,
  previousLabel,
  children,
  step,
  footerText,
  isLoading,
}) => {
  return (
    <>
      <ModalHeader title={title} subtitle={description}></ModalHeader>
      <ModalBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onNextClick();
          }}
        >
          {children}
        </form>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Body className={footerTextStyles}>{footerText}</Body>
        <div className={footerActionsStyles}>
          <Button onClick={onPreviousClick} key={`${step}-previous`}>
            {previousLabel}
          </Button>
          <Button
            onClick={onNextClick}
            disabled={isNextDisabled}
            data-testid="reselect-collections-confirm-button"
            variant="primary"
            loadingIndicator={<SpinLoader />}
            key={`${step}-next`}
            isLoading={isLoading}
          >
            {nextLabel}
          </Button>
        </div>
      </ModalFooter>
    </>
  );
};
