import React from 'react';
import getIndexHelpLink from '../../utils/index-link-helper';
import { Tooltip, Body } from '@mongodb-js/compass-components';

import type { IndexModel } from './indexes-table';
import BadgeWithIconLink from './badge-with-icon-link';

const canRenderTooltip = (type: IndexModel['type']) => {
  return ['text', 'wildcard', 'columnstore'].indexOf(type) !== -1;
};

type TypeFieldProps = {
  type: IndexModel['type'];
  extra: IndexModel['extra'];
};

const IndexTypeTooltip: React.FunctionComponent<{
  extra: IndexModel['extra'];
}> = ({ extra }) => {
  const allowedProps = [
    'weights',
    'default_language',
    'language_override',
    'wildcardProjection',
    'columnstoreProjection',
  ];
  const items: JSX.Element[] = [];
  for (const k in extra) {
    if (allowedProps.includes(k)) {
      items.push(<Body key={k}>{`${k}: ${JSON.stringify(extra[k])}`}</Body>);
    }
  }
  return <>{items}</>;
};

const TypeField: React.FunctionComponent<TypeFieldProps> = ({
  type,
  extra,
}) => {
  // todo: align index types across
  const link = getIndexHelpLink(type.toUpperCase() as any);
  return (
    <Tooltip
      enabled={canRenderTooltip(type)}
      trigger={({ children, ...props }) => (
        <span {...props}>
          {children}
          <BadgeWithIconLink text={type} link={link ?? '#'} />
        </span>
      )}
    >
      <IndexTypeTooltip extra={extra} />
    </Tooltip>
  );
};

export default TypeField;
