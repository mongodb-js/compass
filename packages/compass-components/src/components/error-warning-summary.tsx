import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { Variant as BannerVariant } from '@leafygreen-ui/banner';
import { css } from '@leafygreen-ui/emotion';

import { InlineDefinition } from './inline-definition';
import { Banner, Button } from './leafygreen';

type ErrorOrWarning = { message: string };

const bannerStyle = css({
  marginTop: spacing[1],
});

const listStyle = css({
  padding: 0,
  margin: 0,
  listStylePosition: 'inside',
});

const summaryStyles = css({
  display: 'flex',
});

const actionButtonStyles = css({
  marginLeft: 'auto',
});

function Summary({ messages }: { messages: string[] }): React.ReactElement {
  if (messages.length === 1) {
    return <div>{messages[0]}</div>;
  }

  if (messages.length === 2) {
    return (
      <div>
        <ol className={listStyle}>
          {messages.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ol>
      </div>
    );
  }

  const tooltipErrors = (
    <ol className={listStyle}>
      {messages.map((message, i) => (
        <li key={i}>{message}</li>
      ))}
    </ol>
  );

  const firstMessageNoDot = messages[0].endsWith('.')
    ? messages[0].slice(0, messages[0].length - 1)
    : messages[0];

  return (
    <div>
      <span>
        {firstMessageNoDot}, and other {messages.length - 1} problems.
      </span>{' '}
      <InlineDefinition
        tooltipProps={{
          align: 'top',
          justify: 'start',
          delay: 500,
        }}
        definition={tooltipErrors}
      >
        View all
      </InlineDefinition>
    </div>
  );
}

export function ErrorSummary({
  errors,
  dataTestId,
  onAction,
  actionText,
}: {
  dataTestId?: string;
  errors: ErrorOrWarning[];
  onAction?: () => void;
  actionText?: string;
}): React.ReactElement | null {
  if (!errors || !errors.length) return null;

  return (
    <Banner
      data-testid={dataTestId}
      variant={BannerVariant.Danger}
      className={bannerStyle}
    >
      <div className={summaryStyles}>
        <Summary messages={errors.map((err) => err.message)}></Summary>
        {onAction && actionText && (
          <Button
            data-testid="banner-action"
            size="xsmall"
            onClick={() => onAction()}
            className={actionButtonStyles}
          >
            {actionText}
          </Button>
        )}
      </div>
    </Banner>
  );
}

export function WarningSummary({
  warnings,
}: {
  warnings: ErrorOrWarning[];
}): React.ReactElement | null {
  if (!warnings || !warnings.length) return null;

  return (
    <Banner variant={BannerVariant.Warning} className={bannerStyle}>
      <Summary messages={warnings.map((warning) => warning.message)}></Summary>
    </Banner>
  );
}
