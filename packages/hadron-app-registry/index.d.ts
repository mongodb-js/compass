import EventEmitter from 'eventemitter3';

declare class AppRegistry extends EventEmitter {
  getAction(name: string): unknown
  getComponent(
    componentName: string
  ): React.JSXElementConstructor<unknown> | undefined
  getRole(
    roleName: string
  ): { component: React.JSXElementConstructor<unknown> }[] | undefined
  registerComponent(
    componentName: string,
    component: ReactElement<unknown, string | JSXElementConstructor<unknown>>
  ): void
  deregisterComponent(componentName: string): void
  onActivated(): void
  registerRole(roleName: string, role: {
    component: ReactElement<unknown, string | JSXElementConstructor<unknown>>
  }): void
  removeListener: EventEmitter.removeListener
  listeners: EventEmitter.listeners
  listenerCount: () => number
}

export = AppRegistry;
