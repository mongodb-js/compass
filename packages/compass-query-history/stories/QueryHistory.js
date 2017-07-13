import React from 'react';
import { storiesOf } from '@kadira/storybook';
import QueryHistorySidebarComponent from '../src/components/sidebar-component';
import ConnectedQueryHistoryComponent from '../src/components/';

storiesOf('SidebarComponent', module)
  .add('connected to store', () => <ConnectedQueryHistoryComponent />)
  .add('enabled', () => <QueryHistorySidebarComponent status="enabled" />)
  .add('disabled', () => <QueryHistorySidebarComponent status="disabled" />);
