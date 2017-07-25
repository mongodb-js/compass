import React from 'react';
import { storiesOf } from '@kadira/storybook';
import SidebarComponent from '../src/components/sidebar-component';
import QueryHistoryComponent from '../src/components/';
import FavoriteComponent from '../src/components/favorite-component';
import FavoriteQuery from '../src/models/favorite-query';

storiesOf('SidebarComponent', module)
  .add('connected to store', () => <QueryHistoryComponent />)
  .add('enabled', () => <SidebarComponent />)
  .add('disabled', () => <SidebarComponent />);

const favorite = new FavoriteQuery({
  filter: {"name": "fave 1"},
  sort: {"name": 1},
  skip: 10,
  limit: 100,
  _name: "first favorite",
  _dateSaved: Date.now()});

storiesOf('FavoriteComponent', module)
  .add('connected to store', () => <FavoriteComponent model={favorite}/>);
