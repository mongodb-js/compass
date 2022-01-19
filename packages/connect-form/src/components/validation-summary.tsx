import React from 'react';

import {
  Banner,
  BannerVariant,
  spacing,
  css,
} from '@mongodb-js/compass-components';

import InlineDefinition from '@leafygreen-ui/inline-definition';

type ErrorOrWarning = { message: string };

const bannerStyle = css({
  marginTop: spacing[1],
});

const listStyle = css({
  padding: 0,
  margin: 0,
  listStylePosition: 'inside',
});

export function ErrorSummary({
  errors,
}: {
  errors: ErrorOrWarning[];
}): React.ReactElement | null {
  if (!errors || !errors.length) return null;

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
  return (
    <div>
      {messages.length - 1} problems. &nbsp;
          <InlineDefinition definition={tooltipErrors}>
            View All
          </InlineDefinition>
    </div>
  );
}
