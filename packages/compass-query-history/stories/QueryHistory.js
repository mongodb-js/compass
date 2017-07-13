import React from 'react';
import { storiesOf } from '@kadira/storybook';
import SidebarComponent from '../src/components/sidebar-component';
import QueryHistoryComponent from '../src/components/';

storiesOf('SidebarComponent', module)
  .add('connected to store', () => <QueryHistoryComponent />)
  .add('enabled', () => <SidebarComponent status="enabled" />)
  .add('disabled', () => <SidebarComponent status="disabled" />);
