import React, { ChangeEvent } from 'react';
import { css } from '@emotion/css';
import type { MongoClientOptions } from 'mongodb';
import {
  spacing,
  uiColors,
  Label,
  Description,
  Link,
  Table,
  TableHeader,
  Row,
  Cell,
  Button,
  Modal,
  H3,
  TextInput,
  FormFooter,
  Select,
  Option,
  OptionGroup,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import FormFieldContainer from '../../form-field-container';


const urlOptionsContainerStyles = css({
  marginTop: spacing[3],
  width: '70%',
});

const modalContainerStyles = css({
  padding: 0,
  'button[aria-label="Close modal"]': {
    position: 'absolute',
  }
});

const modalContentStyles = css({
  padding: spacing[5],
});

const addUrlOptionsButtonStyles = css({
  textAlign: 'center',
  marginTop: spacing[3],
});

const modalFooterStyles = css({
  boxShadow: 'none',
  border: 'none',
  borderTop: `1px solid ${uiColors.gray.light2}`,
})

interface UrlOption {
  key: string;
  value: string;
}

const editableUrlOptions = [
	{
		title: 'Connection Timeout',
		values: [
			'connectiTimeoutMS',
			'socketTimeoutMS',
		],
	},
	{
		title: 'Compression Options',
		values: [
			'compressors',
			'zlibCompressionLevel',
		],
	},
	{
		title: 'Connection Pool Options',
		values: [
			'maxPoolSize',
			'minPoolSize',
			'maxIdleTimeMS',
			'waitQueueMultiple',
			'waitQueueTimeoutMS',
		],
	},
	{
		title: 'Write Concern Options',
		values: [
			'w',
			'wtimeoutMS',
			'journal',
		],
	},
	{
		title: 'Read Concern Options',
		values: [
			'readConcernLevel',
		],
	},
	{
		title: 'Read Preferences Options',
		values: [
			'maxStalenessSeconds',
			'readPreferenceTags',
		],
	},
	{
		title: 'Authentication Options',
		values: [
			// 'authSource',
			'authMechanismProperties',
			'gssapiServiceName',
		],
	},
	{
		title: 'Server Options',
		values: [
			'localThresholdMS',
			'serverSelectionTimeoutMS',
			'serverSelectionTryOnce',
			'heartbeatFrequencyMS',
		],
	},
	{
		title: 'Miscellaneous Configuration',
		values: [
			'appName',
			'retryReads',
			'retryWrites',
			'uuidRepresentation',
		],
	},
];

function UrlOptions({
  handleFieldChanged,
  connectionStringUrl,
}: {
  handleFieldChanged: (key: keyof MongoClientOptions, value: unknown) => void;
  connectionStringUrl: ConnectionStringUrl;
}): React.ReactElement {

  const [isModalOpen, setModalOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [option, setOption] = React.useState({key: '', value: ''});

  const urlOptions: UrlOption[] = [];
  editableUrlOptions.forEach(({ values }) => {
    values.forEach((key: string) => {
      if (connectionStringUrl.searchParams.has(key)) {
        urlOptions.push({
          key,
          value: connectionStringUrl.searchParams.get(key) as string,
        });
      }
    });
  });

  const addUrlOption = (event: React.MouseEventHandler<HTMLButtonElement>) => {
    event.preventDefault();
    if (!option.key) {
      return setErrorMessage('Please select the options key.');
    }
    return handleFieldChanged(option.key as keyof MongoClientOptions, option.value);
  }

  return (
    <div className={urlOptionsContainerStyles}>
      <Label htmlFor={''}>Url Options</Label>
      <Description>
        Add other MongoDB url options to customize your connection.&nbsp;
        <Link href={'https://docs.mongodb.com/manual/reference/connection-string/#connection-string-options'}>Learn More</Link>
      </Description>
      <Table
        data={urlOptions}
        columns={[
          <TableHeader key={'key'} label="Key" sortBy={(datum: UrlOption) => datum.key} />,
          <TableHeader key={'value'} label="Value" sortBy={(datum: UrlOption) => datum.value} />,
        ]}
      >
        {({ datum }: {datum: UrlOption}) => (
          <Row key={datum.key}>
            <Cell>{datum.key}</Cell>
            <Cell>{datum.value}</Cell>
          </Row>
        )}
      </Table>
      <div className={addUrlOptionsButtonStyles}>
        <Button
          onClick={() => setModalOpen(isModalOpen => !isModalOpen)}
          variant={'primaryOutline'}
          size={'xsmall'}>
            Add url options
        </Button>
      </div>
      <Modal contentClassName={modalContainerStyles} open={isModalOpen} setOpen={setModalOpen}>
        <div className={modalContentStyles}>
          <H3>Add custom url option</H3>
          <FormFieldContainer>
            <Select
              label="Key"
              placeholder="Select key"
              name="key"
              onChange={key => {
                console.log({type: 'select', value: {
                  key,
                  value: option.value,
                }});
                setOption({
                  key,
                  value: option.value,
                });
              }}
              allowDeselect={false}
              value={option.key}
            >
              {editableUrlOptions.map(({title, values}) => (
                <OptionGroup key={title} label={title}>
                  {values.map(value => <Option key={value} value={value}>{value}</Option>)}
                </OptionGroup>
              ))}
            </Select>
          </FormFieldContainer>
          <FormFieldContainer>
            <TextInput
              onChange={({
                target: { value },
              }: ChangeEvent<HTMLInputElement>) => {
                setOption({
                  key: option.key,
                  value,
                });
              }}
              name={'value'}
              data-testid={'value'}
              label={'Value'}
              type={'text'}
              placeholder={'Value'}
            />
          </FormFieldContainer>
        </div>
        <FormFooter
          className={modalFooterStyles}
          errorMessage={errorMessage}
          primaryButton={<Button variant={'primary'} onClick={addUrlOption}>Save</Button>}
          onCancel={() => setModalOpen(isModalOpen => !isModalOpen)}
        />
      </Modal>
    </div>
  );
}

export default UrlOptions;