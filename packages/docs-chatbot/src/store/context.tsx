// import React from 'react';
// import type {
//   MapStateToProps,
//   ReactReduxContextValue,
//   TypedUseSelectorHook,
// } from 'react-redux';
// import {
//   connect as reduxConnect,
//   Provider as ReduxProvider,
//   createStoreHook,
//   createDispatchHook,
//   createSelectorHook,
// } from 'react-redux';
// import type { configureStore } from '.';
// import type { Store } from 'redux';

// type ChatbotStore = ReturnType<typeof configureStore> extends Store<
//   infer S,
//   infer A
// > & { dispatch: infer D }
//   ? { state: S; actions: A; dispatch: D }
//   : never;

// export const ChatbotStoreContext = React.createContext<
//   ReactReduxContextValue<ChatbotStore['state']>
//   // @ts-expect-error literally impossible for us to pass the store here even
//   // though redux types expect it. This is covered by runtime check though, so
//   // if somehow the store is not getting passed to a correct context, app will
//   // immediately crash
// >(null);

// export const Provider: typeof ReduxProvider = ({ children, store }) => {
//   return (
//     <ReduxProvider store={store} context={ChatbotStoreContext as any}>
//       {children}
//     </ReduxProvider>
//   );
// };

// export const useStore = createStoreHook(
//   ChatbotStoreContext
// ) as () => ReturnType<typeof configureStore>;

// export const useDispatch = createDispatchHook(
//   ChatbotStoreContext
// ) as () => ChatbotStore['dispatch'];

// export const useSelector: TypedUseSelectorHook<ChatbotStore['state']> =
//   createSelectorHook(ChatbotStoreContext);

// export const connect = ((
//   mapState: MapStateToProps<unknown, unknown, unknown>,
//   mapDispatch = null,
//   mergeProps = null
// ) =>
//   reduxConnect(mapState, mapDispatch, mergeProps, {
//     context: ChatbotStoreContext,
//   })) as typeof reduxConnect;
