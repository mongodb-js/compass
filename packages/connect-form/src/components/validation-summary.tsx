import React from 'react';

import { useUiKitContext } from '../contexts/ui-kit-context';

type ErrorOrWarning = { message: string };

export function ErrorSummary({
  errors,
}: {
  errors: ErrorOrWarning[];
}): React.ReactElement | null {
  if (!errors || !errors.length) return null;

  const { Banner, BannerVariant, css, spacing } = useUiKitContext();

  const bannerStyle = css({
    marginTop: spacing[1],
  });

  return (
    <Banner variant={BannerVariant.Danger} className={bannerStyle}>
      <Summary messages={errors.map((err) => err.message)}></Summary>
    </Banner>
  );
}

export function WarningSummary({
  warnings,
}: {
  warnings: ErrorOrWarning[];
}): React.ReactElement | null {
  if (!warnings || !warnings.length) return null;

  const { Banner, BannerVariant, css, spacing } = useUiKitContext();

  const bannerStyle = css({
    marginTop: spacing[1],
  });

  return (
    <Banner variant={BannerVariant.Warning} className={bannerStyle}>
      <Summary messages={warnings.map((warning) => warning.message)}></Summary>
    </Banner>
  );
}

function Summary({ messages }: { messages: string[] }): React.ReactElement {
  if (messages.length === 1) {
    return <div>{messages[0]}</div>;
  }

  const { InlineDefinition, css } = useUiKitContext();

  const listStyle = css({
    padding: 0,
    margin: 0,
    listStylePosition: 'inside',
  });

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
