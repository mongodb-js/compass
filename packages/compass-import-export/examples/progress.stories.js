/* eslint-disable no-alert */
import React from 'react';
import { storiesOf } from '@storybook/react';
import ProgressBar from 'components/progress-bar';

storiesOf('Examples', module)
  .add('ProgressBar', () => {
    const container = {
      padding: '12px'
    };
    const stateName = {
      borderBottom: '1px solid #ccc'
    };
    const cancel = () => {
      window.alert('Cancel source stream.');
    };
    return (
      <div style={container}>
        <h1>ProgressBar Import States</h1>
        <h2 style={stateName}>Start</h2>
        <ProgressBar progress={0} docsWritten={0} docsTotal={2718} status="STARTED" message="Importing documents..." cancel={cancel} />
        
        <h2 style={stateName}>In Progress</h2>
        <ProgressBar progress={50} docsWritten={2718 / 2} docsTotal={2718} status="STARTED" message="Importing documents..." cancel={cancel}/>
        
        <h2 style={stateName}>Completed</h2>
        <ProgressBar progress={100} docsWritten={2718} docsTotal={2718} status="COMPLETED" message="Import completed" />
        
        <h2 style={stateName}>Error on Start</h2>
        <ProgressBar progress={0} docsWritten={0} docsTotal={2718} status="FAILED" message="Import error" />
        
        <h2 style={stateName}>Error While Importing</h2>
        <ProgressBar progress={50} docsWritten={2718/2} docsTotal={2718} status="FAILED" message="Import error" />
        <h2 style={stateName}>User Canceled</h2>
        <ProgressBar progress={75} docsWritten={2038} docsTotal={2718} status="CANCELED" message="Import canceled" />
      </div>
    );
  });
