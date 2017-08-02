# query-history [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> The query history sidebar.

## Usage

This plugin keeps track of recently run queries and any queries that are saved as
"favorites". Queries are sent from Compass to the plugin with the lifecycle
method "onQueryChanged". Each query passed to the component gets made into a
Query model, and first saved as a RecentQuery within the RecentQueryCollection.
The RecentListStore contains the RecentQueryCollection, which saves the queries
 to disk so that they can be reloaded after Compass is closed and then opened
 again. When a user clicks 'favorite' on a recent query, the RecentQuery is
 converted to a FavoriteQuery and is saved in the FavoriteQueryCollection.
 The FavoriteQueryCollection is kept in the FavoriteListStore.

## Notice

When developing the plugin against Compass with `npm link`, one must also link React in order
to not get multiple copies of react loaded. The process:

```shell
cd ~/path/to/10gen/compass
cd node_modules/react
npm link
cd ~/path/to/10gen/compass-query-history
npm link react
npm link
cd ~/path/to/10gen/compass
npm link @mongodb-js/compass-query-history
```

## License

Apache 2

===

## Features

#### Electron

Because the default view is "collapsed", running in Electron will not show anything
initially. If you want to view queries in Electron, you should change the default
`collapsed` value to be false.

#### Enzyme

The test environment is configured to test components with [Enzyme][enzyme] (including full `mount` mode through [jsdom][jsdom]) and [enzyme-chai][enzyme-chai]. See the test folder for examples. Run `npm test` to execute the test suite.

#### Directory Structure

For completeness, below is a list of directories present in this module:

- `.storybook` react-storybook and webpack configuration.
- `electron` code to start electron, open a browser window and load the source.
- `lib` compiled version of your components (plain javascript instead of `jsx`) and styles (`css` instead of `less`).
- `src` components, actions and stores source code, as well as style files.
  - Components
    - `favorite-componet` - the wrapper around `QueryComponent` that supplies interactions for favorite queries (copy, delete).
    - `favorites-list-component` - the list of favorite queries gets rendered here.
    - `header-component` - the header of the query history sidebar, i.e. the toggle button between views, is rendered here.
    - `index.jsx` - the top-level component `QueryHistoryComponent` is rendered here, which just wraps the `SidebarComponent`.
    - `query-component` - where the shared information between recent and favorite queries gets rendered.
    - `recent-component` - the wrapper around `QueryComponent` that supplies interactions for recent queries (copy, delete, save).
    - `recent-list-component` - the list of recent queries gets rendered here.
    - `saving-component` - renders a recent query that is in the process of being saved.
    - `show-query-history-button` - a button that collapses or un-collapses the sidebar. Imported into Compass separately.
    - `sidebar-component` - the component that contains the header, and either the `RecentListComponent` or the `FavoritesListComponent` depending on if the `showing` state is "recent" or "favorites".`
  - Models
    - `favorite-query` - the wrapper around `query` that keeps track of the name and date saved.
    - `favorite-query-collection` - a collection of favorite queries that gets saved to disk.
    - `query` - a mongodb query.
    - `recent-query` - the wrapper around `query` that indicates the query is a recent query.
    - `recent-query-collection` - a collection of recent queries that gets saved to disk.
  - Stores
    - `favorites-list-store` - the store that contains the `FavoriteQueryCollection` and keeps track of all the favorite queries. All the interactions with a favorite query are handled here.
    - `header-store` - the store that keeps track of if recent or favorite queries are being displayed.
    - `recent-list-store` - the store tht contains the `RecentQueryCollection` and keeps track of all the recent queries. All the interactions with a recent query are handled here.
    - `sidebar-store` - the top-level store that handles the plugin lifecycle methods, for namespace or query changes. Also handles if the sidebar is collapsed or not.
  - Actions
    - `showFavorites` - switch the view to show the favorites list.
    - `showRecent` - switch the view to show the recents list.
    - `collapse` - set `collapsed` to true so nothing will render.
    - `toggleCollapse` - show the sidebar if it's hidden or vice versa.
    - `copyQuery` - copy a query onto the clipboard.
    - `deleteRecent` - delete a recent query.
    - `deleteFavorite` - delete a favorite query.
    - `addRecent` - add a recent query, this is triggered from the `onQueryChanged` lifecycle method.
    - `saveRecent` - move a recent query into the saving state.
    - `saveFavorite` - the user has added a name to the query being saved and pressed 'save'.
    - `cancelSave` - the user has pressed 'cancel' on the currently being saved query.
    - `runQuery` - the user has clicked on the query card and wants to populate the query bar with the contents of this saved query. This action is listened to by Compass.
    - `namespaceChanged` - the namespace has changed so new queries will be saved with the new namespace and the queries being shown should be limited to the current namespace.
- `stories` stories for react-storybook. You can add as many story files as you like, they are automatically added to storybook. Because of a dependency of the StorageMixin, react-storybook won't work unless it's uses in the query models are commented out.
- `test`


## License

Apache 2.0

[travis_img]: https://travis-ci.com/10gen/compass-query-history.svg?token=ezEB2TnpPiu7XLo6ByZp&branch=master
[travis_url]: https://travis-ci.com/10gen/compass-query-history
[npm_img]: https://img.shields.io/npm/v/@mongodb-js/compass-query-history.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/@mongodb-js/compass-query-history
[react-storybook]: https://github.com/kadirahq/react-storybook
[enzyme]: http://airbnb.io/enzyme/
[enzyme-chai]: https://github.com/producthunt/chai-enzyme
[jsdom]: https://github.com/tmpvar/jsdom
