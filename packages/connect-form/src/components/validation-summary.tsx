import React from 'react';

import {
  Banner,
  BannerVariant,
} from '@mongodb-js/compass-components';

type ErrorOrWarning = { message: string };

export function ErrorSummary({errors}: {errors: ErrorOrWarning[]}): React.ReactElement | null  {
  if (!errors || !errors.length) return null;

  return (<Banner variant={BannerVariant.Danger}>
    <Summary messages={errors.map(err => err.message)}></Summary>
  </Banner>);
}

export function WarningSummary({warnings}: {warnings: ErrorOrWarning[]}): React.ReactElement | null  {
  if (!warnings || !warnings.length) return null;

  return (<Banner variant={BannerVariant.Warning}>
    <Summary messages={warnings.map(warning => warning.message)}></Summary>
  </Banner>);
}

function Summary({messages}: {messages: string[]}): React.ReactElement {
  return (<ol>{messages.map((message, i) => (<li key={i}>{message}</li>))}</ol>);
}
