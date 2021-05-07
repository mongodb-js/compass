// import React from 'react';
// import { storiesOf } from '@storybook/react';
// import { ComponentPreview } from 'storybook/decorators';

// import { Provider } from 'react-redux';
// import { INITIAL_STATE } from 'modules/import';
// import configureStore from 'stores';
// import DataService from './data-service-provider';

// import ImportModal from 'components/import-modal';

// const BASE_STATE = {
//   ...INITIAL_STATE,
//   dataService: {
//     error: null,
//     dataService: new DataService()
//   }
// };

// storiesOf('Examples', module)
//   .addDecorator(story => <ComponentPreview>{story()}</ComponentPreview>)
//   .add('Import', () => {
//     const initialState = {
//       ...BASE_STATE
//     };
//     const store = configureStore({
//       initialState
//     });
//     return (
//       <Provider store={store}>
//         <ImportModal />
//       </Provider>
//     );
//   });
