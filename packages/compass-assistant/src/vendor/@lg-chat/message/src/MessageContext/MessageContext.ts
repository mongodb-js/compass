import { createContext, useContext } from 'react';

// Define the shape of the context data
interface MessageContextType {
  messageBody?: string;
}

// Create the context object
export const MessageContext = createContext<MessageContextType | null>(null);

// Create a custom hook for easy and safe consumption
export const useMessageContext = () => {
  const context = useContext(MessageContext);

  if (!context) {
    // This error ensures the hook is used within a provider
    throw new Error(
      'useMessageContext must be used within a MessageContextProvider'
    );
  }

  return context;
};
