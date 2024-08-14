type ConnectionDisconnectedEvent = {
  name: 'Connection Disconnected';
  payload: {
    connection_id: string;
  };
};

type ConnectionCreatedEvent = {
  name: 'Connection Created';
  payload: {
    color?: string;
    connection_id: string;
  };
};

type ConnectionRemovedEvent = {
  name: 'Connection Removed';
  payload: {
    connection_id: string;
  };
};

type ScreenEvent = {
  name: 'Screen';
  payload: {
    name: string;
  };
};

type ErrorFetchingAttributes = {
  name: 'Error Fetching Attributes';
  payload: {
    event_name: string;
  };
};

export type TelemetryEvent =
  | ConnectionDisconnectedEvent
  | ConnectionCreatedEvent
  | ConnectionRemovedEvent
  | ErrorFetchingAttributes
  | ScreenEvent;
