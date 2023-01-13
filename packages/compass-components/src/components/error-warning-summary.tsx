import React, { useMemo } from 'react';
import { Variant as BannerVariant } from '@leafygreen-ui/banner';
import { css, cx } from '@leafygreen-ui/emotion';

import { InlineDefinition } from './inline-definition';
import { Banner, Button } from './leafygreen';

const bannerStyle = css({
  width: '100%',
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

const BannerWithSummary: React.FunctionComponent<
  {
    messages: string | string[];
    variant: BannerVariant;
    ['data-testid']?: string;
    className?: string;
  } & (
    | { actionText: string; onAction(): void }
    | { actionText?: never; onAction?: never }
  )
> = ({
  ['data-testid']: dataTestId,
  messages,
  onAction,
  actionText,
  variant,
  className,
}) => {
  const _messages = useMemo(() => {
    return !Array.isArray(messages) ? [messages] : messages;
  }, [messages]);

  return (
    <Banner
      data-testid={dataTestId}
      variant={variant}
      className={cx(bannerStyle, className)}
    >
      <div className={summaryStyles}>
        <Summary messages={_messages}></Summary>
        {onAction && actionText && (
          <Button
            data-testid="banner-action"
            size="xsmall"
            onClick={onAction}
            className={actionButtonStyles}
          >
            {actionText}
          </Button>
        )}
      </div>
    </Banner>
  );
};

export const ErrorSummary: React.FunctionComponent<
  {
    className?: string;
    errors: string | string[];
    ['data-testid']?: string;
  } & (
    | { actionText: string; onAction(): void }
    | { actionText?: never; onAction?: never }
  )
> = ({ className, errors, ...props }) => {
  return (
    <BannerWithSummary
      className={className}
      messages={errors}
      variant={BannerVariant.Danger}
      {...props}
    ></BannerWithSummary>
  );
};

export const WarningSummary: React.FunctionComponent<
  {
    className?: string;
    warnings: string | string[];
    ['data-testid']?: string;
  } & (
    | { actionText: string; onAction(): void }
    | { actionText?: never; onAction?: never }
  )
> = ({ className, warnings, ...props }) => {
  return (
    <BannerWithSummary
      className={className}
      messages={warnings}
      variant={BannerVariant.Warning}
      {...props}
    ></BannerWithSummary>
  );
};
