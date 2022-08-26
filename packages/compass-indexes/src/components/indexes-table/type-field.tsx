import React from 'react';
import getIndexHelpLink from '../../utils/index-link-helper';
import { Tooltip, Body } from '@mongodb-js/compass-components';

import type { IndexDefinition } from '../../modules/indexes';
import BadgeWithIconLink from './badge-with-icon-link';

export const canRenderTooltip = (type: IndexDefinition['type']) => {
  return ['text', 'wildcard', 'columnstore'].indexOf(type) !== -1;
};

type TypeFieldProps = {
  type: IndexDefinition['type'];
  extra: IndexDefinition['extra'];
};

export const IndexTypeTooltip: React.FunctionComponent<{
  extra: IndexDefinition['extra'];
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
