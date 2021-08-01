import React, { useEffect, useRef, useState } from 'react';
import FlexLayout, {
  BorderNode,
  Layout,
  TabNode,
  TabSetNode,
  IJsonModel
} from 'flexlayout-react';
import { ITabSetRenderValues } from 'flexlayout-react/declarations/view/Layout';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
const Shell = require('@mongodb-js/compass-shell');

// import 'flexlayout-react/style/light.css';

import Panel from './Panel';

// declare global {
//   interface Window { [someField: string]: any }
// }

const PANEL_COMPONENT_ID = 'Panel';
const SHELL_COMPONENT_ID = 'Shell';

type DataService = any; // TODO

type Props = {
  isDataLake: boolean,
  dataService: DataService
}

const defaultLayout: IJsonModel = {
  global: {
    tabEnableRename: false
  },
  layout: {
    type: 'row',
    id: '#1',
    children: [
      {
        type: 'tabset',
        id: '#2',
        weight: 50,
        // enableDrop: false,
        // enableDrag: false,
        children: [
          {
            type: 'tab',
            id: '#4',
            name: 'Instance',
            // component: 'grid',
            component: PANEL_COMPONENT_ID,
            config: {
              id: '2'
              // No db or col.
            }
          },
          {
            type: 'tab',
            id: '#5',
            name: 'Database',
            // component: 'grid',
            component: PANEL_COMPONENT_ID,
            config: {
              id: '2',
              databaseName: 'air'
            }
          },
          {
            type: 'tab',
            id: '#6',
            name: 'Collection',
            // component: 'grid',
            component: PANEL_COMPONENT_ID,
            config: {
              id: '2',
              databaseName: 'air',
              collectionName: 'airports'
            }
          },
          {
            type: 'tab',
            id: '#14',
            name: 'Shell',
            // component: 'grid',
            component: SHELL_COMPONENT_ID,
            config: {
              id: '14'
            }
          },
        ]
      }
    ]
  },
  borders: []
};

function Workspace(
  props: Props
): React.ReactElement {
  const [ model, setModel ] = useState(
    FlexLayout.Model.fromJson(defaultLayout)
  );

  function factory(node: TabNode) {
    const component = node.getComponent();
    console.log('factory component', component);
    if (component === PANEL_COMPONENT_ID) {
      const {
        databaseName,
        collectionName
      } = node.getConfig();
      return <Panel
        databaseName={databaseName}
        collectionName={collectionName}
        isDataLake={props.isDataLake}
      />;
    } else if (component === SHELL_COMPONENT_ID) {
      // const {
      //   databaseName,
      //   collectionName
      // } = node.getConfig();

      // const {
      //   store,
      //   Plugin
      // } = createPlugin();

      console.log('render shell w/ dataService', props.dataService);
      console.log('Shell', Shell);

      // return <Shell
      //   dataService={props.dataService}
      //   // databaseName={databaseName}
      //   // collectionName={collectionName}
      //   // isDataLake={props.isDataLake}
      // />;
    }
  }

  // TODO: How to make this only for this function.
  
  const layoutRef = useRef<Layout>(null);

  // Listen for the open shell events and open a shell tab.
  useEffect(() => {
    const openShellFromEvent = () => {
      console.log('openShellFromEvent');
      // if (!model.getMaximizedTabset()) {
      layoutRef.current?.addTabToActiveTabSet({
        component: SHELL_COMPONENT_ID,
        name: 'Shell'
      });
      // }
    };

    // Add an event listener for opening shell, which will update our state.
    // TODO: Type for global app registry.
    (global as any).hadronApp.appRegistry.on('open-shell', openShellFromEvent);
    
    return () => {
      // TODO: Cleanup event listener.
      // (global as any).hadronApp.appRegistry.on('open-shell', openShellFromEvent)
    }
  }, []); // Empty parentheses will cause this to run once at mount.

  // function iconFactory(node: TabNode) {
  //   //   const {
  //   //   databaseName,
  //   //   collectionName
  //   // } = node.getConfig();
  //   const iconName = node.getIcon();

  //   // close

  //   return <Icon
  //     glyph="Plus"
  //   />;

  //   // <IconButton
  //   //   className={styles['info-btn']}
  //   //   aria-label="Time-series collections documentation"
  //   //   onClick={() => {
  //   //     openLink(helpUrl);
  //   //   }}
  //   // >
  //   //   <Icon
  //   //     glyph="InfoWithCircle"
  //   //     size="small"
  //   //   />
  //   // </IconButton>
  // }

  function onAddFromTabSetButton(node: TabSetNode | BorderNode) {
    console.log('on add node.getName:', node.getId());

    layoutRef.current?.addTabToTabSet(node.getId(), {
      component: PANEL_COMPONENT_ID,
      name: 'aaaaa',
      config: {
        id: '55', // TODO: Keep an id index counter.
        databaseName: 'aa'
      }
    });
  }

  const onRenderTabSet = (
    node: (TabSetNode | BorderNode),
    renderValues: ITabSetRenderValues
  ) => {
    renderValues.stickyButtons.push(
      <IconButton
        key={node.getId()}
        title="New Tab"
        aria-label="New Tab"
        onClick={() => onAddFromTabSetButton(node)}
      >
        <Icon
          glyph="Plus"
          size="small"
        />
      </IconButton>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        flexGrow: 1
      }}
    >
      <Layout
        model={model}
        factory={factory}
        ref={layoutRef}
        // iconFactory={iconFactory}
        onRenderTabSet={onRenderTabSet}
      />
    </div>
  );
}

export default Workspace;
