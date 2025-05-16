// import React, { createContext, useContext, useRef } from 'react';
// import { createServiceLocator } from 'hadron-app-registry';

// import { useSelector, useStore } from './store/context';
// import {
//   openContextualMessageInChat,
//   type OpenChatOptions,
//   // ChatMessageAction
// } from './store/chat';

// function useChatbotStore() {
//   try {
//     return useStore();
//   } catch {
//     throw new Error(
//       "Can't find Chatbot store in React context. Make sure you are using Chatbot service and hooks inside Chatbot scope"
//     );
//   }
// }

// export type ChatbotService = {
//   openChatWithMessage(
//     this: void,
//     options: OpenChatOptions
//   ): Promise<string | null>;
//   // openChat(this: void): WorkspaceTab | null;

//   // Setup a handler for a chat message
//   // todo: type the options
//   // onChatMessageAction?: (handler: (options: ChatMessageAction) => void) => () => void;
// };

// // Separate type to avoid exposing internal prop in exported types
// type ChatbotServiceImpl = ChatbotService;

// const throwIfNotTestEnv = () => {
//   if (process.env.NODE_ENV !== 'test') {
//     throw new Error(
//       "Can't find Chatbot service in React context. Make sure you are using Chatbot service and hooks inside Chatbot scope"
//     );
//   }
// };

// const noopChatbotService: ChatbotService = {
//   openChatWithMessage() {
//     throwIfNotTestEnv();
//     return Promise.resolve(null);
//   },
//   // onChatMessageAction() {
//   //   throwIfNotTestEnv();
//   //   return () => {
//   //     // noop
//   //   };
//   // },
//   // [kSelector]() {
//   //   throwIfNotTestEnv();
//   //   return null;
//   // },
// };

// const ChatbotServiceContext = createContext<ChatbotServiceImpl>(
//   noopChatbotService
// );

// // function createChatbotService() {
// //   // Note: copied pasted from Chatbot provider, this comment isn't relevant
// //   // We're breaking React rules of hooks here, but this is unavoidable to allow
// //   // for testing components using this service. In reality this will never be a
// //   // conditional call to hooks: either the tests will be providing a mock
// //   // service for all renders, or not and we will call hooks that are setting up
// //   // the service from actual store
// //   /* eslint-disable react-hooks/rules-of-hooks */
// //   const store = useChatbotStore();
// //   const service = useRef<ChatbotServiceImpl>({
// //     openChatWithMessage: (options: OpenChatOptions) => {
// //       return store.dispatch(openContextualMessageInChat(options));
// //     },
// //     // onChatMessageAction: () => {
// //     //   return getActiveTab(store.getState());
// //     // },
// //     // [kSelector]: useActiveChatbotSelector,
// //   });

// //   return service.current;
// // }`

// // Not quite what we should be doing, but it works.
// // export function useChatbotService() {
// //   const store = useChatbotStore();
// //   const service = useRef<ChatbotServiceImpl>({
// //     openChatWithMessage: (options: OpenChatOptions) => {
// //       return store.dispatch(openContextualMessageInChat(options));
// //     },
// //     // onChatMessageAction: () => {
// //     //   return getActiveTab(store.getState());
// //     // },
// //     // [kSelector]: useActiveChatbotSelector,
// //   });

// //   return service.current;
// // }

// export const ChatbotServiceProvider: React.FunctionComponent<{
//   value?: ChatbotService;
// }> = ({ value, children }) => {
//   // Note: copied pasted from Chatbot provider, this comment isn't relevant
//   // We're breaking React rules of hooks here, but this is unavoidable to allow
//   // for testing components using this service. In reality this will never be a
//   // conditional call to hooks: either the tests will be providing a mock
//   // service for all renders, or not and we will call hooks that are setting up
//   // the service from actual store
//   /* eslint-disable react-hooks/rules-of-hooks */
//   value ??= (() => {
//     const store = useChatbotStore();
//     const service = useRef<ChatbotServiceImpl>({
//       openChatWithMessage: (options: OpenChatOptions) => {
//         return store.dispatch(openContextualMessageInChat(options));
//       },
//       // onChatMessageAction: () => {
//       //   return getActiveTab(store.getState());
//       // },
//       // [kSelector]: useActiveChatbotSelector,
//     });
//     return service.current;
//   })();
//   /* eslint-enable react-hooks/rules-of-hooks */

//   return (
//     <ChatbotServiceContext.Provider value={value}>
//       {children}
//     </ChatbotServiceContext.Provider>
//   );
// };

// // const HANDLERS = {
// //   onMessage: new Map<string, (() => void)[]>(),
// // } as const;

// function useChatbotService() {
//   const service = useContext(ChatbotServiceContext);
//   if (!service) {
//     throw new Error(
//       "Can't find Chatbot service in React context. Make sure you are using Chatbot service and hooks inside Chatbot scope"
//     );
//   }

//   // TODO: map of things
//   // const handlers = useRegisterTabDestroyHandler();
//   // return { ...service, ...handlers };
//   return { ...service };
// }

// export function useOpenChat() {
//   const {
//     openChatWithMessage,
//     // openCollectionWorkspace,
//   } = useChatbotService();

//   const fns = useRef({
//     openChatWithMessage,
//   });

//   return fns.current;
// }

// export const chatbotServiceLocator = createServiceLocator(
//   useChatbotService as () => ChatbotService,
//   'chatbotServiceLocator'
// );
