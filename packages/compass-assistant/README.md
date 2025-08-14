# Compass Assistant Architecture

## Overview

The Compass Assistant package provides a modular architecture for integrating AI-powered assistance into MongoDB Compass. The components are designed to be flexible and composable, allowing the assistant functionality to be placed at different levels in the component tree.

## Architecture

### Components

1. **AssistantProvider** - Context provider that manages chat state and provides assistant functionality
2. **AssistantChat** - Chat interface component that consumes the assistant context
3. **AssistantDrawer** - Pre-configured drawer section that wraps AssistantChat
4. **useAssistant** - Hook for consuming assistant context in components

### Usage Patterns

#### Basic Setup

```tsx
import {
  AssistantProvider,
  AssistantDrawer,
} from '@mongodb-js/compass-assistant';

// At the top level, wrap your app with the provider
<AssistantProvider chat={chatInstance}>
  <YourApp />

  {/* Place the drawer anywhere in your component tree */}
  <AssistantDrawer />
</AssistantProvider>;
```

#### Custom Implementation

```tsx
import {
  AssistantProvider,
  AssistantChat,
  useAssistant,
} from '@mongodb-js/compass-assistant';

// Custom component that uses the assistant context
function CustomAssistantUI() {
  const { messages, sendMessage } = useAssistant();

  return (
    <div>
      <h2>Custom Assistant UI</h2>
      <AssistantChat />
      <div>Message count: {messages.length}</div>
    </div>
  );
}

// Usage
<AssistantProvider chat={chatInstance}>
  <YourApp />
  <CustomAssistantUI />
</AssistantProvider>;
```

## Benefits

- **Separation of Concerns**: Chat UI is separate from state management
- **Flexibility**: Components can be placed at any level in the tree
- **Reusability**: Multiple components can consume the same assistant context
- **Testability**: Easy to mock context for testing individual components

## Migration Guide

If upgrading from the old prop-based approach:

**Before:**

```tsx
<AssistantChat messages={messages} onSendMessage={handleSend} />
```

**After:**

```tsx
<AssistantProvider chat={chatInstance}>
  <AssistantChat />
</AssistantProvider>
```
