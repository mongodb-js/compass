import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  css,
  cx,
  H2,
  Button,
  Card,
  Tabs,
  Tab,
  spacing,
  fontFamilies,
  uiColors,
  Icon,
  Link,
  Select,
  Option,
  Badge,
  IconButton,
} from '@mongodb-js/compass-components';
import type { FullMessage, ConnectionPair } from 'mongodb-wp-proxy';
import { Proxy } from 'mongodb-wp-proxy';
import type { Document as BSONDocument } from 'bson';
import BannerImage from './banner-image';

type NewConnectionEvent = {
  type: 'newConnection';
  id: number;
  incoming: string;
  timestamp: number;
};

type DisconnectedEvent = {
  type: 'disconnected';
  id: number;
  source: 'incoming' | 'outgoing';
  timestamp: number;
};

type MessageEvent = {
  type: 'message';
  id: number;
  source: 'incoming' | 'outgoing';
  msg: FullMessage;
  response: null | FullMessage;
  timestamp: number;
};

type Event = NewConnectionEvent | DisconnectedEvent | MessageEvent;

const buttonReset = css({
  display: 'inline',
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
});

const clone = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

const ButtonLink: React.FunctionComponent<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ onClick, children, disabled, className }) => {
  return (
    <Link
      as="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(buttonReset, className)}
      hideExternalIcon
    >
      {children}
    </Link>
  );
};

const SourceName: Record<'incoming' | 'outgoing', string> = {
  incoming: 'Server',
  outgoing: 'Client',
};

const linkButton = css({
  all: 'unset',
  cursor: 'pointer',
  '&:hover, &:focus': {
    textDecoration: 'underline',
  },
});

const colors = {
  string: css({ color: uiColors.blue.base }),
  number: css({ color: uiColors.green.dark1 }),
  boolean: css({ color: uiColors.green.dark1 }),
  null: css({ color: uiColors.gray.dark1 }),
} as const;

const SimpleJsonViewElement: React.FunctionComponent<{
  elKey: string;
  elValue:
    | number
    | string
    | boolean
    | null
    | undefined
    | Record<string, unknown>
    | unknown[];
  level?: number;
}> = ({ elKey, elValue, level = 0 }) => {
  const [expanded, setExpanded] = useState(level < 2);
  const isArray = Array.isArray(elValue);
  const isObject = typeof elValue === 'object' && elValue !== null;
  const isExpandable = isArray || isObject;
  const space = level * spacing[2];

  if (typeof elValue === 'undefined') {
    return null;
  }

  return (
    <>
      {isExpandable ? (
        <button
          className={linkButton}
          style={{ marginLeft: space }}
          onClick={() => {
            setExpanded((expanded) => !expanded);
          }}
        >
          {elKey}:
        </button>
      ) : (
        <div style={{ marginLeft: space }}>{elKey}:</div>
      )}
      <div className={cx(colors[elValue === null ? 'null' : typeof elValue])}>
        {isArray
          ? !expanded
            ? '[…]'
            : ''
          : isObject
          ? !expanded
            ? '{…}'
            : ''
          : typeof elValue === 'string'
          ? `"${elValue}"`
          : String(elValue)}
      </div>
      {isExpandable &&
        expanded &&
        Object.keys(elValue).map((key) => {
          return (
            <SimpleJsonViewElement
              key={`${elKey}.${key}`}
              elKey={key}
              elValue={elValue[key]}
              level={level + 1}
            ></SimpleJsonViewElement>
          );
        })}
    </>
  );
};

const copyButton = css({
  display: 'none',
  position: 'absolute',
  top: spacing[2],
  right: spacing[2],
  zIndex: 1,
  'div:hover > &': {
    display: 'block',
  },
});

const jsonTable = css({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: spacing[2],
  fontFamily: fontFamilies.code,
  fontSize: '12px',
  lineHeight: `${spacing[3]}px`,
  backgroundColor: uiColors.gray.light2,
  padding: spacing[2],
  borderRadius: spacing[1],
  overflow: 'hidden'
});

const SimpleJsonView: React.FunctionComponent<{
  value: Record<string, unknown>;
}> = ({ value }) => {
  return (
    <div className={jsonTable}>
      <IconButton
        aria-label="Copy"
        className={copyButton}
        onClick={() => {
          void window.navigator.clipboard.writeText(
            JSON.stringify(value, null, 2)
          );
        }}
      >
        <Icon glyph="Copy"></Icon>
      </IconButton>
      {Object.keys(value).map((key) => {
        return (
          <SimpleJsonViewElement
            key={key}
            elKey={key}
            elValue={value[key]}
          ></SimpleJsonViewElement>
        );
      })}
    </div>
  );
};

const smallHeading = css({
  marginTop: spacing[2],
  marginBottom: spacing[2],
});

const messageHeader = css({
  display: 'flex',
});

const messageLastItem = css({
  marginLeft: 'auto',
});

const EventHeader: React.FunctionComponent<{ event: Event }> = ({ event }) => {
  const id = String(event.id).padStart(5, '0');

  let content = null;

  if (event.type === 'newConnection') {
    content = (
      <>
        <span>New connection from {event.incoming}</span>
        <span className={messageLastItem}>(connection_id={id})</span>
      </>
    );
  }

  if (event.type === 'disconnected') {
    content = (
      <>
        <span>{SourceName[event.source]} closed connection</span>
        <span className={messageLastItem}>(connection_id={id})</span>
      </>
    );
  }

  if (event.type === 'message') {
    content = (
      <>
        <span>Message from {SourceName[event.source].toLocaleLowerCase()}</span>
        <span className={messageLastItem}>
          (connection_id={id}, op_code={event.msg.contents.opCode})
        </span>
      </>
    );
  }
  return (
    <div className={messageHeader}>
      <span>{new Date(event.timestamp).toLocaleString()}</span>&nbsp;
      {content}
    </div>
  );
};

const smallTab = css({
  '&[role="tab"]': {
    fontWeight: 'normal',
    fontSize: '14px',
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
    paddingLeft: spacing[2],
    paddingRight: spacing[2],
    color: 'inherit',
  },
  '&[role="tabpanel"]': {
    // marginTop: spacing[2],
    // marginBottom: spacing[2],
  },
});

const FullMessageJsonView: React.FunctionComponent<{
  message: FullMessage;
}> = ({ message }) => {
  return (
    <div>
      <h4 className={smallHeading}>Header</h4>
      <SimpleJsonView value={message.header}></SimpleJsonView>
      <h4 className={smallHeading}>Body</h4>
      <SimpleJsonView value={message.contents}></SimpleJsonView>
    </div>
  );
};

function getBodySection(message: FullMessage) {
  if (message.contents.opCode === 'OP_MSG') {
    const body = message.contents.sections.find(
      (section) => section.kind === 'Body'
    );
    if (body?.kind !== 'Body') {
      return null;
    }
    return body;
  }
  return null;
}

function getAggregationFromMessage(
  message: FullMessage
): { database: string; collection: string; pipeline: BSONDocument[] } | null {
  const section = getBodySection(message);
  if (!section) {
    return null;
  }
  const {
    $db: database,
    aggregate: collection,
    pipeline,
  } = section.body.data ?? {};
  if (database && collection && pipeline) {
    return { database, collection, pipeline };
  }
  return null;
}

type Query = {
  filter: BSONDocument;
  sort?: BSONDocument;
  project?: BSONDocument;
  skip?: number;
  limit?: number;
  // maxTimeMS?: number;
  collation?: BSONDocument;
};

function getQueryFromMessage(
  message: FullMessage
): { database: string; collection: string; query: Query } | null {
  const section = getBodySection(message);
  if (!section) {
    return null;
  }
  const {
    $db: database,
    find: collection,
    filter,
    sort,
    projection: project,
    skip,
    limit,
    // maxTimeMS,
    collation,
  } = section.body.data ?? {};
  if (database && collection && filter) {
    return {
      database,
      collection,
      query: clone({ filter, sort, project, skip, limit, collation }),
    };
  }
  return null;
}

function getNamespace(
  input:
    | ReturnType<typeof getQueryFromMessage>
    | ReturnType<typeof getAggregationFromMessage>
) {
  if (!input) {
    return '';
  }
  return `${input?.database}.${input?.collection}`;
}

const infoBlock = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
});

const infoIcon = css({
  display: 'inline-block',
});

const eventContent = css({
  // marginTop: spacing[2],
  // marginBottom: spacing[2],
});

const MessageEventContent: React.FunctionComponent<{
  event: MessageEvent;
}> = ({ event }) => {
  const [opening, setIsOpening] = useState(false);
  const [selected, setSelected] = useState(0);

  const query = useMemo(() => {
    return getQueryFromMessage(event.msg);
  }, [event.msg]);

  const aggregation = useMemo(() => {
    return getAggregationFromMessage(event.msg);
  }, [event.msg]);

  const isQueryOrAggregation = query || aggregation;

  const onRunQueryOrAggregation = useCallback(() => {
    setIsOpening(true);
    (globalThis as any).hadronApp.appRegistry.emit(
      'debugger-open-collection-in-new-tab',
      {
        ns: getNamespace(query ?? aggregation),
        ...(query && { query: query.query }),
        ...(aggregation && { aggregation: aggregation.pipeline }),
      }
    );
  }, [query, aggregation]);

  // leafygreen doesn't handle empty slots well so we have to do its job for it
  const tabs = [
    query && (
      <Tab key="Query" name="Query" className={smallTab}>
        <div style={{ paddingTop: spacing[2] }}>
          <SimpleJsonView value={query}></SimpleJsonView>
        </div>
      </Tab>
    ),
    aggregation && (
      <Tab key="Aggregation" name="Aggregation" className={smallTab}>
        <div style={{ paddingTop: spacing[2] }}>
          <SimpleJsonView value={aggregation}></SimpleJsonView>
        </div>
      </Tab>
    ),
    <Tab key="Request" name="Request" className={smallTab}>
      <FullMessageJsonView message={event.msg}></FullMessageJsonView>
    </Tab>,
    <Tab key="Response" name="Response" className={smallTab}>
      {event.response ? (
        <FullMessageJsonView message={event.response}></FullMessageJsonView>
      ) : (
        <div style={{ paddingTop: spacing[2] }}>No response</div>
      )}
    </Tab>,
  ].filter(Boolean);

  return (
    <div className={eventContent}>
      {isQueryOrAggregation && (
        <div className={infoBlock}>
          <Badge variant="darkgray">{query ? 'find' : 'aggregate'}</Badge>
          {/* <Icon
            size="small"
            className={infoIcon}
            glyph={query ? 'CurlyBraces' : 'Array'}
          ></Icon> */}
          <span>
            This is{' '}
            {query ? (
              <>
                a <strong>query</strong>
              </>
            ) : (
              <>
                an <strong>aggregation</strong>
              </>
            )}{' '}
            for collection <strong>{getNamespace(query ?? aggregation)}</strong>
            .&nbsp;
            <ButtonLink onClick={onRunQueryOrAggregation} disabled={opening}>
              Run in Compass
            </ButtonLink>
          </span>
        </div>
      )}
      <Tabs
        aria-label="Request and response"
        setSelected={setSelected}
        selected={selected}
      >
        {tabs}
      </Tabs>
    </div>
  );
};

const EventItem: React.FunctionComponent<{ event: Event }> = ({ event }) => {
  let content = null;

  if (event.type === 'message') {
    content = <MessageEventContent event={event}></MessageEventContent>;
  }

  return (
    <Card style={{ padding: 8 }}>
      <EventHeader event={event}></EventHeader>
      {content}
    </Card>
  );
};

const landingBanner = css({
  maxWidth: spacing[6] * 10,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  margin: 'auto',
  marginTop: spacing[6] * 1,
  padding: spacing[3],
});

const debuggerMessagesList = css({
  listStyle: 'none',
  paddingBottom: spacing[2],
  overflow: 'auto',
});

const leafygreenSelect = css({
  minWidth: '18ch',
  '& > button': {
    marginTop: 0,
  },
});

class PoorMansGlobalStoreForProxy {
  private proxy: Proxy | null = null;
  private connections: Set<ConnectionPair> = new Set();
  public events: Event[] = [];
  public target: { host: string; port: number } | null = null;
  public connected = false;
  public address: { address: string; port: number } | null = null;
  private onEventUpdate: ((events: Event[]) => void) | null = null;
  private pushEvent(event: Event) {
    this.events = this.events.concat(event);
    this.onEventUpdate?.(this.events);
  }
  private putMessageEvent(
    id: number,
    source: 'incoming' | 'outgoing',
    msg: FullMessage
  ) {
    msg = clone(msg);
    const eventToUpdate = this.events.find((evt) => {
      return (
        evt.id === id &&
        evt.type === 'message' &&
        evt.msg.header.requestID === msg.header.responseTo
      );
    });
    if (eventToUpdate) {
      this.events = this.events.map((evt) => {
        if (evt === eventToUpdate) {
          return {
            ...eventToUpdate,
            response: msg,
          };
        } else {
          return evt;
        }
      });
    } else {
      this.events = this.events.concat({
        id,
        type: 'message',
        source,
        msg,
        response: null,
        timestamp: Date.now(),
      });
    }
    this.onEventUpdate?.(this.events);
  }
  public async listen(target: any) {
    if (this.connected) {
      console.warn('You should close current connection first');
      void this.close();
    }
    this.target = target;
    this.proxy = new Proxy(target);
    this.proxy.on('newConnection', (conn: ConnectionPair) => {
      this.connections.add(conn);
      this.pushEvent({
        type: 'newConnection',
        id: conn.id,
        incoming: conn.incoming,
        timestamp: Date.now(),
      });
      conn.on('connectionEnded', (source: 'incoming' | 'outgoing') => {
        this.pushEvent({
          type: 'disconnected',
          id: conn.id,
          source,
          timestamp: Date.now(),
        });
      });
      // TODO
      // conn.on('parseError', (source: string, err: Error) => {
      // });
      conn.on('connectionError', (source: string, err: Error) => {
        console.log('connectionError', source, err);
      });
      conn.on(
        'message',
        (source: 'incoming' | 'outgoing', msg: FullMessage) => {
          this.putMessageEvent(conn.id, source, msg);
        }
      );
    });
    await this.proxy.listen({ host: 'localhost', port: 0 });
    this.address = await this.proxy.address();
    this.connected = true;
  }
  public async close() {
    try {
      for (const conn of this.connections) {
        conn.removeAllListeners();
      }
      await this.proxy?.close();
      this.connections.clear();
      this.proxy?.removeAllListeners();
      this.proxy = null;
      this.target = null;
      this.address = null;
      this.events = [];
      this.connected = false;
    } catch {
      // todo: closing can leave old proxy in weird state
    }
  }
  public subscribe(fn: typeof this.onEventUpdate) {
    this.onEventUpdate = fn;
  }
  public unsubscribe() {
    this.onEventUpdate = null;
  }
  public clear() {
    this.events = [];
    this.onEventUpdate?.(this.events);
  }
}

const proxyStore = new PoorMansGlobalStoreForProxy();

const content = css({
  flex: 1,
});

const contentTable = css({
  display: 'grid',
  gridTemplateColumns: '100%',
  gridTemplateRows: 'auto 1fr',
});

function getEventId(event: Event) {
  return [
    event.id,
    event.type,
    event.timestamp,
    event.type === 'newConnection' ? event.incoming : event.source,
    event.type === 'message' ? event.msg.header.requestID : false,
  ]
    .filter(Boolean)
    .join(':');
}

const Debugger: React.FunctionComponent = () => {
  const [proxyState, setProxyState] = useState<
    'initial' | 'starting' | 'running' | 'stopping' | 'error'
  >(proxyStore.connected ? 'running' : 'initial');
  // const [proxyError, setProxyError] = useState<string | null>(null);
  const [proxyAddress, setProxyAddress] = useState(proxyStore.address);
  const [events, setEvents] = useState(proxyStore.events);
  const [connectionTarget, setConnectionTarget] = useState(proxyStore.target);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    proxyStore.subscribe((events) => {
      setEvents(events);
    });
    return () => {
      proxyStore.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setConnectionTarget((connectionTarget) => {
      if (connectionTarget === null) {
        const connectionString = (globalThis as any).hadronApp.appRegistry
          .getStore('App.InstanceStore')
          .getState()
          .dataService.getConnectionString();
        const [host, port] = connectionString.hosts[0].split(':');
        return {
          host,
          port: +(port || 27017),
        };
      }
      return connectionTarget;
    });
  }, []);

  const startDebugger = useCallback(async () => {
    try {
      setProxyState('starting');
      await proxyStore.listen(connectionTarget);
      setProxyAddress(proxyStore.address);
      setProxyState('running');
    } catch (e) {
      // setProxyError((e as Error).message);
      setProxyState('error');
    }
  }, [connectionTarget]);

  const stopDebugger = useCallback(() => {
    setProxyState('stopping');
    void proxyStore.close();
    setProxyState('initial');
    setEvents([]);
  }, []);

  const sortedEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (filter === 'all') {
          return true;
        }
        if (event.type !== 'message') {
          return false;
        }
        const section = getBodySection(event.msg);
        return section?.body.data.find || section?.body.data.aggregate;
      })
      .sort((a, b) => {
        return (b.timestamp - a.timestamp) * (sort === 'newest' ? 1 : -1);
      })
      .slice(0, 50);
  }, [events, sort, filter]);

  if (!connectionTarget) {
    return null;
  }

  if (proxyState === 'initial' || proxyState === 'starting') {
    return (
      <div className={landingBanner}>
        <div style={{ width: '340px' }}>
          <BannerImage></BannerImage>
        </div>
        <H2>Inspect your app</H2>
        <p>
          Start a debugger server, connect your app to it, and inspect how your
          app interacts with MongoDB in real time
        </p>
        <Button
          disabled={proxyState !== 'initial'}
          onClick={() => {
            void startDebugger();
          }}
          variant="primary"
          size="large"
        >
          Start debugger
        </Button>
      </div>
    );
  }

  return (
    <div className={cx(content, contentTable)}>
      <div
        style={{
          padding: 8,
          display: 'flex',
          alignItems: 'baseline',
          width: '100%',
        }}
      >
        <span>
          Proxy is running at{' '}
          <ButtonLink
            onClick={() => {
              if (proxyAddress) {
                void navigator.clipboard.writeText(
                  `mongodb://${proxyAddress.address}:${proxyAddress.port}`
                );
                document?.activeElement?.blur?.();
              }
            }}
          >
            {proxyAddress?.address}:{proxyAddress?.port}
          </ButtonLink>
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button
            size="small"
            onClick={() => {
              void stopDebugger();
            }}
          >
            Stop debugger
          </Button>

          <Button
            size="small"
            onClick={() => {
              proxyStore.clear();
            }}
          >
            Clear log
          </Button>

          <Select
            size="small"
            aria-label="Filter by"
            aria-labelledby="leafygreen requires this even though it is not needed and actually bad"
            value={filter}
            onChange={setFilter}
            className={leafygreenSelect}
            allowDeselect={false}
          >
            <Option value="all">All events</Option>
            <Option value="queries">Only queries</Option>
          </Select>

          <Select
            size="small"
            aria-label="Sort by"
            aria-labelledby="ditto"
            value={sort}
            onChange={setSort}
            className={leafygreenSelect}
            allowDeselect={false}
          >
            <Option value="newest">Newest first</Option>
            <Option value="oldest">Oldest first</Option>
          </Select>
        </span>
      </div>
      <ul className={debuggerMessagesList}>
        {sortedEvents.map((event) => {
          return (
            <li key={getEventId(event)} style={{ margin: 8 }}>
              <EventItem event={event} />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Debugger;
