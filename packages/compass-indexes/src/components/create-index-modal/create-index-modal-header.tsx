import {
  H3,
  Body,
  spacing,
  css,
  palette,
  Link,
} from '@mongodb-js/compass-components';
import React from 'react';

const headerStyle = css({
  padding: spacing[800],
  paddingBottom: 0,
});

const subtitleStyle = css({
  color: palette.gray.dark1,
});

const CreateIndexModalHeader = () => {
  return (
    <div className={headerStyle}>
      <H3 data-testid="create-index-modal-header-title">Create Index</H3>

      <Body
        data-testid="create-index-modal-header-subtitle"
        className={subtitleStyle}
      >
        The best indexes for your application should consider a number of
        factors, such as your data model, and the queries you use most often. To
        learn more about indexing best practices, read the{' '}
        <Link
          href="https://docs.mongodb.com/manual/applications/indexes/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Index Strategies Documentation
        </Link>
        .
      </Body>
    </div>
  );
};

export default CreateIndexModalHeader;
