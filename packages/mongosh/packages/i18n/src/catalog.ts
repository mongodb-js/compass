interface HelpItem {
  description: string;
  link?: string;
  example?: string;
  attributes?: Record<string, HelpItem>;
}

interface ClassHelpItem {
  help: HelpItem;
}

type NestedRecord = string | {
  [key: string]: NestedRecord;
};

export default interface Catalog {
  [packageName: string]: {
    classes: Record<string, ClassHelpItem>;
  } | NestedRecord;
}
