import i18n from '@mongosh/i18n';
import { shellApiType, asPrintable } from './enums';

type HelpPropertiesAttr = {
  name?: string;
  description: string;
};

export type HelpProperties = {
  help: string;
  docs?: string;
  attr?: HelpPropertiesAttr[];
};

type HelpOptions = {
  translate(key: string): string | undefined;
};

const DEFAULT_TRANSLATE = i18n.translateApiHelp.bind(i18n);

export default class Help {
  private help: string;
  private docs: string;
  private attr: HelpPropertiesAttr[] = [];

  constructor(properties: HelpProperties, options: HelpOptions = { translate: DEFAULT_TRANSLATE }) {
    this.help = options.translate(properties.help) as string;
    this.docs = options.translate(properties.docs as string) as string;
    this.attr = (properties.attr || [])
      .map((attr) => ({
        name: attr.name,
        description: options.translate(attr.description),
      })).filter(
        attr => attr.description // at least the description should be there
      ) as HelpPropertiesAttr[];
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): HelpProperties {
    const { help, docs, attr } = this;
    return { help, docs, attr };
  }

  get [shellApiType](): string { return 'Help'; }
}
