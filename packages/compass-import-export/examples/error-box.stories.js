import React from 'react';
import { storiesOf } from '@storybook/react';
import ErrorBox from 'components/error-box';

import parseJSON from 'parse-json';

storiesOf('Examples', module)
  .add('ErrorBox', () => {
    const container = {
      padding: '12px'
    };
    const stateName = {
      borderBottom: '1px solid #ccc'
    };

    function getASimpleError() {
      try {
        throw new TypeError('I am a simple error message');
      } catch (err) {
        return err;
      }
    }
    function getAnImportError() {
      const c = `{
        "_id": 1,
      }`;
      try {
        parseJSON(c);
      } catch (e) {
        return e;
      }
    }
    return (
      <div style={container}>
        <h1>ErrorBox States</h1>
        <h2 style={stateName}>No Error</h2>
        <ErrorBox />
        <h2 style={stateName}>Simple Error</h2>
        <ErrorBox error={getASimpleError()} />
        <h2 style={stateName}>JSON Parsing Error</h2>
        <ErrorBox error={getAnImportError()} />
      </div>
    );
  });
