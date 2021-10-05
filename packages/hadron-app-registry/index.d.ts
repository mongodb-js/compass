import EventEmitter from 'eventemitter3';

enum AppRegistryRoles {
  COLLECTION_WORKSPACE = 'Collection.Workspace',
  APPLICATION_CONNECT = 'Application.Connect',
  INSTANCE_WORKSPACE = 'Instance.Workspace',
  DATABASE_WORKSPACE = 'Database.Workspace',
  FIND_IN_PAGE = 'Find',
  GLOBAL_MODAL = 'Global.Modal'
}

enum AppRegistryComponents {
  SIDEBAR_COMPONENT = 'Sidebar.Component',
  SHELL_COMPONENT = 'Global.Shell'
}

enum AppRegistryActions {
  STATUS_ACTIONS = 'Status.Actions'
};

declare class AppRegistry extends EventEmitter {
  getAction(name: AppRegistryActions): {
    done: () => void;
    configure: (opts: {
      animation: boolean;
      message: string;
      visible: boolean;
    }) => void;
  };
  getComponent(
    componentName: string
  ): React.JSXElementConstructor<unknown> | undefined;
  getRole(
    roleName: AppRegistryRoles
  ): 
    | {
        component: React.JSXElementConstructor<unknown>
      }[]
    | undefined;
  registerComponent(
    componentName: string,
    component: ReactElement<unknown, string | JSXElementConstructor<unknown>>
  ): void;
  deregisterComponent(componentName: string): void;
  onActivated(): void;
  registerRole(roleName: string, role: {
    component: ReactElement<unknown, string | JSXElementConstructor<unknown>>
  }): void;
  removeListener: EventEmitter.removeListener;
  listeners: EventEmitter.listeners;
  listenerCount: () => number;
}

export = AppRegistry;
