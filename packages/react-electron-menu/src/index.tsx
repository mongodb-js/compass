import React, { useContext, useEffect, useRef, useState } from 'react';
import type {
  MenuItemConstructorOptions,
  IpcRenderer,
  KeyboardEvent as ElectronKeyboardEvent,
} from 'electron';
import debounce from 'lodash/debounce';

const ElectronMenuIpcContext = React.createContext<IpcRenderer | null>(null);

export const ElectronMenuIpcProvider = ElectronMenuIpcContext.Provider;

type ElectronMenuItemOptions = Omit<
  MenuItemConstructorOptions,
  'id' | 'label' | 'submenu'
> & {
  id: string;
  label: string;
  submenu?: ElectronMenuItemOptions[];
};

type MenuItemContentProps = Pick<
  ElectronMenuItemOptions,
  'label' | 'sublabel' | 'toolTip'
>;

type MenuItemStateProps = Pick<
  ElectronMenuItemOptions,
  'enabled' | 'visible' | 'checked' | 'acceleratorWorksWhenHidden'
>;

type MenuItemTypeProps = Pick<
  ElectronMenuItemOptions,
  'role' | 'accelerator'
> & {
  type?: Extract<
    ElectronMenuItemOptions['type'],
    'normal' | 'checkbox' | 'radio' | 'separator'
  >;
};

interface ElectronMenuTemplateBuilder {
  updateItem(
    prevItem: ElectronMenuItemOptions | null,
    newItem: ElectronMenuItemOptions | null
  ): void;
  getTemplate(): ElectronMenuItemOptions | ElectronMenuItemOptions[];
  subscribe(
    fn: (template: ElectronMenuItemOptions | ElectronMenuItemOptions[]) => void
  ): () => void;
}

class TemplateBuilder implements ElectronMenuTemplateBuilder {
  private items = new Map<
    string,
    ElectronMenuItemOptions | { type: 'submenuRef'; items: Set<string> }
  >();
  private submenus = new Map<string, ElectronMenuItemOptions>();
  private subscriptions = new Set<
    (template: ElectronMenuItemOptions | ElectronMenuItemOptions[]) => void
  >();
  constructor(private type: 'menu' | 'submenu') {}
  getTemplate(): ElectronMenuItemOptions | ElectronMenuItemOptions[] {
    const menuItems = Array.from(this.items.values()).flatMap((item) => {
      return item.type === 'submenuRef'
        ? (() => {
            let submenuItem = {
              id: '',
              type: 'submenu',
              submenu: [] as ElectronMenuItemOptions[],
            };
            for (const submenuId of item.items.values()) {
              const { submenu = [], ...item } = this.submenus.get(submenuId)!;
              const menuItems = submenuItem.submenu.concat(submenu);
              submenuItem = {
                ...submenuItem,
                ...item,
                submenu: menuItems,
              };
            }
            return submenuItem as ElectronMenuItemOptions;
          })()
        : item;
    });
    return this.type === 'menu'
      ? menuItems
      : {
          id: '',
          label: '',
          type: 'submenu',
          submenu: menuItems,
        };
  }
  updateItem(
    prevItem: ElectronMenuItemOptions | null,
    newItem: ElectronMenuItemOptions | null
  ): void {
    const itemType = prevItem?.type ?? newItem?.type;
    if (itemType === 'submenu') {
      if (newItem) {
        this.submenus.set(newItem.id, newItem);
        const item =
          this.items.get(newItem.label) ??
          this.items
            .set(newItem.label, {
              type: 'submenuRef',
              items: new Set(),
            })
            .get(newItem.label);
        if (item?.type === 'submenuRef') {
          item.items.add(newItem.id);
        }
      } else if (prevItem) {
        this.submenus.delete(prevItem.id);
        const item = this.items.get(prevItem.label);
        if (item?.type === 'submenuRef') {
          item.items.delete(prevItem.id);
          if (item.items.size === 0) {
            this.items.delete(prevItem.label);
          }
        }
      }
    } else {
      if (newItem) {
        this.items.set(newItem.label, newItem);
      } else if (prevItem) {
        this.items.delete(prevItem.label);
      }
    }
    const template = this.getTemplate();
    this.subscriptions.forEach((fn) => {
      fn(template);
    });
  }
  subscribe(
    fn: (template: ElectronMenuItemOptions | ElectronMenuItemOptions[]) => void
  ): () => void {
    this.subscriptions.add(fn);
    return () => {
      this.subscriptions.delete(fn);
    };
  }
}

const ElectronMenuTemplateBuilderContext =
  React.createContext<ElectronMenuTemplateBuilder>({
    updateItem() {
      // noop
    },
    getTemplate() {
      return [];
    },
    subscribe() {
      return () => {
        // noop
      };
    },
  });

type ElectronMenuClickEventHandler = (event: ElectronKeyboardEvent) => void;

interface ElectronMenuClickHandler {
  subscribe(id: string, fn: ElectronMenuClickEventHandler): () => void;
}

class IpcClickHandler implements ElectronMenuClickHandler {
  private subscriptions = new Map<string, ElectronMenuClickEventHandler>();
  constructor(private ipc?: IpcRenderer) {
    ipc?.on('react-electron-menu-on-click', this.onClickHandler);
  }
  private onClickHandler = (
    _ipcEvent: unknown,
    id: string,
    event: ElectronKeyboardEvent
  ) => {
    this.subscriptions.get(id)?.(event);
  };
  subscribe(id: string, fn: ElectronMenuClickEventHandler): () => void {
    this.subscriptions.set(id, fn);
    return () => {
      this.subscriptions.delete(id);
    };
  }
  cleanup() {
    this.ipc?.off('react-electron-menu-on-click', this.onClickHandler);
  }
}

const ElectronMenuClickHandlerContext =
  React.createContext<ElectronMenuClickHandler>({
    subscribe() {
      return () => {
        // noop
      };
    },
  });

function useCurrectRef<T>(val: T): { current: T } {
  const ref = useRef(val);
  ref.current = val;
  return ref;
}

function useClickHandler(ipc?: IpcRenderer) {
  const ref = useRef<IpcClickHandler>();
  if (!ref.current) {
    ref.current = new IpcClickHandler(ipc);
  }
  return ref.current;
}

function useTemplateBuilder(type: 'menu' | 'submenu') {
  const ref = useRef<TemplateBuilder>();
  if (!ref.current) {
    ref.current = new TemplateBuilder(type);
  }
  return ref.current;
}

export function ElectronMenu({
  children,
  type,
  trigger,
}: { children: React.ReactNode } & (
  | { type?: never; trigger?: never }
  | { type: 'dock'; trigger?: never }
  | {
      type: 'context';
      trigger: <T extends React.LegacyRef<Element>>(props: {
        ref: T;
      }) => React.ReactNode;
    }
)) {
  const id = useId();
  const ipcRef = useRef(useContext(ElectronMenuIpcContext));
  const triggerRef = useRef<HTMLElement>(null);
  const typeRef = useRef(type);
  const idRef = useCurrectRef(id);
  const clickHandler = useClickHandler(ipcRef.current!);
  const templateBuilder = useTemplateBuilder('menu');

  const emitUpdateRef = useRef(
    debounce(
      (template: ElectronMenuItemOptions | ElectronMenuItemOptions[]) => {
        ipcRef.current?.send('react-electron-menu-update', {
          id: idRef.current,
          type: typeRef.current ?? 'menu',
          template,
        });
      }
    )
  );

  useEffect(() => {
    if (typeRef.current !== 'context') {
      return;
    }

    const trigger = triggerRef.current;
    const onContextMenu = () => {
      ipcRef.current?.send('react-electron-menu-contextmenu-click', {
        id: idRef.current,
      });
    };
    trigger?.addEventListener('contextmenu', onContextMenu);
    return () => {
      trigger?.removeEventListener('contextmenu', onContextMenu);
    };
  });

  useEffect(() => {
    emitUpdateRef.current(templateBuilder.getTemplate());
    return templateBuilder.subscribe((template) => {
      emitUpdateRef.current(template);
    });
  }, [templateBuilder]);

  useEffect(() => {
    return () => {
      clickHandler.cleanup();
    };
  }, [clickHandler]);

  return (
    <ElectronMenuTemplateBuilderContext.Provider value={templateBuilder}>
      <ElectronMenuClickHandlerContext.Provider value={clickHandler}>
        {trigger?.({ ref: triggerRef })}
        {children}
      </ElectronMenuClickHandlerContext.Provider>
    </ElectronMenuTemplateBuilderContext.Provider>
  );
}

function useId(defaultId?: string) {
  const [id] = useState(() => {
    return defaultId ?? crypto.randomUUID();
  });
  return id;
}

type MenuGroupProps = MenuItemContentProps & {
  id?: string;
  children: React.ReactNode;
};

export function ElectronSubMenu({
  id: _id,
  label,
  sublabel,
  toolTip,
  children,
}: MenuGroupProps) {
  const id = useId(_id);
  const parentTemplateBuilder = useContext(ElectronMenuTemplateBuilderContext);
  const submenuTemplateBuilder = useTemplateBuilder('submenu');
  const currentSubmenuOptionsRef = useCurrectRef({
    id,
    label,
    sublabel,
    toolTip,
  });
  const previousTemplateRef = useRef<ElectronMenuItemOptions | null>(null);
  const updateTemplateRef = useRef(function (
    template: ElectronMenuItemOptions | ElectronMenuItemOptions[]
  ) {
    if (Array.isArray(template)) {
      throw new Error('Incorrect state');
    }
    const newTemplate: ElectronMenuItemOptions = {
      ...currentSubmenuOptionsRef.current,
      type: 'submenu',
      submenu: template.submenu,
    };
    parentTemplateBuilder.updateItem(previousTemplateRef.current, newTemplate);
    previousTemplateRef.current = newTemplate;
  });

  useEffect(() => {
    updateTemplateRef.current(submenuTemplateBuilder.getTemplate());
    return () => {
      parentTemplateBuilder.updateItem(previousTemplateRef.current, null);
    };
  }, [parentTemplateBuilder, submenuTemplateBuilder]);

  useEffect(() => {
    return submenuTemplateBuilder.subscribe((template) => {
      updateTemplateRef.current(template);
    });
  }, [submenuTemplateBuilder]);

  return (
    <ElectronMenuTemplateBuilderContext.Provider value={submenuTemplateBuilder}>
      {children}
    </ElectronMenuTemplateBuilderContext.Provider>
  );
}

type MenuItemProps = {
  id?: string;
  onClick?: (event: ElectronKeyboardEvent) => void;
} & MenuItemContentProps &
  MenuItemStateProps &
  MenuItemTypeProps;

export function ElectronMenuItem({
  id: _id,
  label,
  sublabel,
  toolTip,
  enabled,
  visible,
  checked,
  acceleratorWorksWhenHidden,
  role,
  type,
  accelerator,
  onClick,
}: MenuItemProps) {
  const id = useId(_id);
  const parentTemplateBuilderRef = useRef(
    useContext(ElectronMenuTemplateBuilderContext)
  );
  const onClickRef = useCurrectRef(onClick);
  const clickHandlerRef = useRef(useContext(ElectronMenuClickHandlerContext));
  const previousTemplateRef = useRef<ElectronMenuItemOptions | null>(null);

  useEffect(() => {
    const clickHandler = clickHandlerRef.current;
    return clickHandler.subscribe(id, (event) => {
      onClickRef.current?.(event);
    });
  }, [id, onClickRef]);

  useEffect(() => {
    const template = Object.fromEntries(
      Object.entries({
        id,
        label,
        sublabel,
        toolTip,
        enabled,
        visible,
        checked,
        acceleratorWorksWhenHidden,
        role,
        type,
        accelerator,
      }).filter(([, val]) => {
        return typeof val !== 'undefined';
      })
    ) as unknown as ElectronMenuItemOptions;

    parentTemplateBuilderRef.current.updateItem(
      previousTemplateRef.current,
      template
    );
    previousTemplateRef.current = template;
  }, [
    id,
    accelerator,
    acceleratorWorksWhenHidden,
    checked,
    enabled,
    label,
    role,
    sublabel,
    toolTip,
    type,
    visible,
  ]);

  useEffect(() => {
    const builder = parentTemplateBuilderRef.current;
    return () => {
      builder.updateItem(previousTemplateRef.current, null);
    };
  }, []);

  return null;
}

export function ElectronMenuSeparator() {
  const id = useId();
  return <ElectronMenuItem label={id} type="separator"></ElectronMenuItem>;
}
