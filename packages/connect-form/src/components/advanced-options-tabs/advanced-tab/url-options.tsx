import React from 'react';
import { css } from '@emotion/css';
import type { MongoClientOptions } from 'mongodb';
import {
  spacing,
  Label,
  Description,
  Link,
  Table,
  TableHeader,
  Row,
  Cell,
  Button,
  IconButton,
  Icon,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { editableUrlOptions, UrlOption } from '../../../utils/url-options';

import UrlOptionsModal from './url-options-modal';

const urlOptionsContainerStyles = css({
  marginTop: spacing[3],
  width: '70%',
});

const addUrlOptionsButtonStyles = css({
  textAlign: 'center',
  marginTop: spacing[3],
});

const optionValueStyles = css({
  span: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});

function UrlOptions({
  handleFieldChanged,
  connectionStringUrl,
}: {
  handleFieldChanged: (key: keyof MongoClientOptions, value: unknown) => void;
  connectionStringUrl: ConnectionStringUrl;
}): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [option, setOption] = React.useState<UrlOption | undefined>(undefined);

  const urlOptions: UrlOption[] = [];
  editableUrlOptions.forEach(({ values }) => {
    values.forEach((key: string) => {
      if (connectionStringUrl.searchParams.has(key)) {
        urlOptions.push({
          key: key as UrlOption['key'],
          value: connectionStringUrl.searchParams.get(key) as string,
        });
      }
    });
  });

  const addUrlOption = () => {
    setOption(undefined);
    setIsModalOpen(true);
  };

  const saveUrlOption = (option: UrlOption) => {
    handleFieldChanged(option.key, option.value);
    setOption(undefined);
    setIsModalOpen(false);
  };

  const editUrlOption = (option: UrlOption) => {
    setOption(option);
    setIsModalOpen(true);
  };

  return (
    <div className={urlOptionsContainerStyles}>
      <Label htmlFor={''}>Url Options</Label>
      <Description>
        Add other MongoDB url options to customize your connection.&nbsp;
        <Link
          href={
            'https://docs.mongodb.com/manual/reference/connection-string/#connection-string-options'
          }
        >
          Learn More
        </Link>
      </Description>
      <Table
        data-testid='url-options-table'
        data={urlOptions}
        columns={[
          <TableHeader
            key={'key'}
            label="Key"
            sortBy={(datum: UrlOption) => datum.key}
          />,
          <TableHeader
            key={'value'}
            label="Value"
            sortBy={(datum: UrlOption) => datum.value}
          />,
        ]}
      >
        {({ datum }: { datum: UrlOption }) => (
          <Row key={datum.key}>
            <Cell>{datum.key}</Cell>
            <Cell className={optionValueStyles}>
              {datum.value ?? ''}
              <IconButton
                aria-label={`Edit option: ${datum.key}`}
                onClick={() => editUrlOption(datum)}
              >
                <Icon glyph="Edit" />
              </IconButton>
            </Cell>
          </Row>
        )}
      </Table>
      <div className={addUrlOptionsButtonStyles}>
        <Button
          data-testid='add-url-options-button'
          onClick={() => addUrlOption()}
          variant={'primaryOutline'}
          size={'xsmall'}
        >
          Add url options
        </Button>
      </div>
      {isModalOpen && (
        <UrlOptionsModal
          onClose={setIsModalOpen}
          selectedOption={option}
          onUpdateOption={saveUrlOption}
        />
      )}
    </div>
  );
}

export default UrlOptions;
