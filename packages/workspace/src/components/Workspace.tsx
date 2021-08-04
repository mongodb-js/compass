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
// import { CompassShell } from '@mongodb-js/compass-shell';
// import Shell from '@mongodb-js/compass-shell';
// const Shell = require('@mongodb-js/compass-shell');
//     "hadron-react-components": "^5.4.0",
// const Shell = require('../../../compass-shell/src');
// import Shell from '../../../compass-shell/src';

// import 'flexlayout-react/style/light.css';

import Panel from './Panel';
import { Namespace } from './types';

// declare global {
//   interface Window { [someField: string]: any }
// }

const PANEL_COMPONENT_ID = 'Panel';
const SHELL_COMPONENT_ID = 'Shell';
const PERFORMANCE_COMPONENT_ID = 'Performance';

type DataService = any; // TODO

type Props = {
  isDataLake: boolean,
  dataService: DataService
}

function getNodeNameFromNS(ns: Namespace) {
  if (!ns.databaseName) {
    return 'Databases';
  }

  if (!ns.collectionName) {
    return ns.databaseName;
  }

  return `${ns.databaseName}.${ns.collectionName}`
}

const defaultLayout: IJsonModel = {
  global: {
    splitterSize: 4,
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
            name: 'Databases',
            // component: 'grid',
            component: PANEL_COMPONENT_ID,
            config: {
              id: '2'
              // No db or col.
            }
          }
        ]
      }
    ]
  },
  borders: []
};

export default function Workspace({
  isDataLake,
  // dataService
}: Props) {
  const [ model, setModel ] = useState(
    FlexLayout.Model.fromJson(defaultLayout)
  );

  function factory(node: TabNode) {
    const component = node.getComponent();
    // console.log('factory component', component);
    if (component === PANEL_COMPONENT_ID) {
      const nodeConfig = node.getConfig();
      const {
        databaseName,
        collectionName,
        // shortcutToPerformance
      } = nodeConfig;
      return <Panel
        databaseName={databaseName}
        collectionName={collectionName}
        isDataLake={isDataLake}
        // shortcutToPerformance={shortcutToPerformance}
        updateNamespace={(ns: Namespace) => {
          // console.log('update to ns', ns);
          model.doAction(FlexLayout.Actions.updateNodeAttributes(
            node.getId(),
            {
              name: getNodeNameFromNS(ns),
              config: {
                ...nodeConfig,
                databaseName: ns.databaseName,
                collectionName: ns.collectionName
              }
            }
          ));
        }}
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

      // console.log('render shell w/ dataService', dataService);
      const ShellComponent = (global as any).hadronApp.appRegistry.getComponent(
        'Global.Shell'
      );
      // console.log('ShellComponent', ShellComponent);

      return (
        <ShellComponent
          // Hacky :)
          dataService={(global as any).hadronApp.appRegistry.stores[
            'Connect.Store'
          ].dataService}
        />
      );

    //   return <Shell
    //     // Hacky :)
    //     dataService={(global as any).hadronApp.appRegistry.stores['Connect.Store'].dataService}
    //     // dataService={props.dataService}
    //     // databaseName={databaseName}
    //     // collectionName={collectionName}
    //     // isDataLake={props.isDataLake}
    //   />;
    } else if (component === PERFORMANCE_COMPONENT_ID) {
      const PerformanceComponent = (global as any).hadronApp.appRegistry.getRole(
        'Performance.Tab'
      )[0].component;

      return <PerformanceComponent />;
    }
  }

  // TODO: How to make this only for this function.
  
  const layoutRef = useRef<Layout>(null);

  // Listen for the open shell events and open a shell tab.
  useEffect(() => {
    function openShellFromEvent() {
      console.log('openShellFromEvent');
      // if (!model.getMaximizedTabset()) {
      layoutRef.current?.addTabToActiveTabSet({
        component: SHELL_COMPONENT_ID,
        name: 'Shell'
      });
      // }
    }
    
    function openNamespaceFromSidebar(meta: {
      namespace: string
    }) {
      const {
        namespace
        // TODO: Break ns into db name and col name.
        // Add collection attributes.
      } = meta;

      const namespaceObject = {
        databaseName: namespace.split('.')[0],
        collectionName: namespace.split('.')[1]
      };

      layoutRef.current?.addTabToActiveTabSet({
        component: PANEL_COMPONENT_ID,
        name: getNodeNameFromNS(namespaceObject), // TODO: Ensure this is xss safe.
        config: namespaceObject
      });
    }

    function openPerformance() {
      layoutRef.current?.addTabToActiveTabSet({
        component: PERFORMANCE_COMPONENT_ID,
        name: 'Performance'
      });
    }

    // Add an event listener for opening shell, which will update our state.
    // TODO: Type for global app registry.
    (global as any).hadronApp.appRegistry.on('open-shell', openShellFromEvent);
    
    // Actions.updateNodeAttributes(nodeId, attributes)
    // TODO: Event types and hadron + app registry types.
    (global as any).hadronApp.appRegistry.on(
      'sidebar-select-namespace',
      openNamespaceFromSidebar
    );

    (global as any).hadronApp.appRegistry.on(
      'sidebar-open-performance',
      openPerformance
    );
    // 

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
    // console.log('on add node.getName:', node.getId());

    layoutRef.current?.addTabToTabSet(node.getId(), {
      component: PANEL_COMPONENT_ID,
      name: getNodeNameFromNS({ }),
      config: {
        id: '55', // TODO: Keep an id index counter.
        // databaseName: 'air'
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
        // supportsPopout
      />
    </div>
  );
}
