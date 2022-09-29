import type React from 'react';

import { withTheme } from '../hooks/use-theme';

// This file exports `@leafygreen-ui` components and wraps some of
// them with a listener to Compass' theme in the react context.

// 1. Import the components we use from leafygreen.
import { default as Badge } from '@leafygreen-ui/badge';
import { default as Banner } from '@leafygreen-ui/banner';
import { default as LeafyGreenButton } from '@leafygreen-ui/button';
import { default as LeafyGreenCheckbox } from '@leafygreen-ui/checkbox';
import { default as LeafyGreenCard } from '@leafygreen-ui/card';
import { default as LeafyGreenCode } from '@leafygreen-ui/code';
import { default as LeafyGreenConfirmationModal } from '@leafygreen-ui/confirmation-modal';
import { default as Icon } from '@leafygreen-ui/icon';
import { default as LeafyGreenIconButton } from '@leafygreen-ui/icon-button';
import {
  AtlasLogoMark,
  MongoDBLogoMark,
  MongoDBLogo,
} from '@leafygreen-ui/logo';
import { Menu, MenuSeparator, MenuItem } from '@leafygreen-ui/menu';
import {
  default as LeafyGreenModal,
  Footer as LeafyGreenModalFooter,
} from '@leafygreen-ui/modal';
import { default as LeafyGreenMarketingModal } from '@leafygreen-ui/marketing-modal';
import Popover from '@leafygreen-ui/popover';
import { RadioBox, RadioBoxGroup } from '@leafygreen-ui/radio-box-group';
import {
  Radio,
  RadioGroup as LeafyGreenRadioGroup,
} from '@leafygreen-ui/radio-group';
import {
  SegmentedControl as LeafyGreenSegmentedControl,
  SegmentedControlOption,
} from '@leafygreen-ui/segmented-control';
import {
  Select as LeafyGreenSelect,
  Option,
  OptionGroup,
} from '@leafygreen-ui/select';
import {
  Table as LeafyGreenTable,
  TableHeader,
  Row,
  Cell,
} from '@leafygreen-ui/table';
import { Tabs as LeafyGreenTabs, Tab } from '@leafygreen-ui/tabs';
import { default as LeafyGreenTextArea } from '@leafygreen-ui/text-area';
import { default as LeafyGreenTextInput } from '@leafygreen-ui/text-input';
import {
  default as Toast,
  Variant as ToastVariant,
} from '@leafygreen-ui/toast';
import { default as LeafyGreenToggle } from '@leafygreen-ui/toggle';
import {
  H1 as LeafyGreenH1,
  H2 as LeafyGreenH2,
  H3 as LeafyGreenH3,
  Subtitle as LeafyGreenSubtitle,
  Body as LeafyGreenBody,
  InlineCode as LeafyGreenInlineCode,
  InlineKeyCode as LeafyGreenInlineKeyCode,
  Disclaimer as LeafyGreenDisclaimer,
  Overline as LeafyGreenOverline,
  Link as LeafyGreenLink,
  Label as LeafyGreenLabel,
  Description as LeafyGreenDescription,
} from '@leafygreen-ui/typography';
import {
  Combobox as LeafyGreenCombobox,
  ComboboxOption,
  ComboboxGroup,
} from '@leafygreen-ui/combobox';

// 2. Wrap the components that accept darkMode with Compass' theme.

const H1: typeof LeafyGreenH1 = withTheme(LeafyGreenH1) as typeof LeafyGreenH1;
const H2: typeof LeafyGreenH2 = withTheme(LeafyGreenH2) as typeof LeafyGreenH2;
const H3: typeof LeafyGreenH3 = withTheme(LeafyGreenH3) as typeof LeafyGreenH3;
const Subtitle = withTheme(LeafyGreenSubtitle) as typeof LeafyGreenSubtitle;
const Body = withTheme(LeafyGreenBody) as typeof LeafyGreenBody;
const InlineCode = withTheme(
  LeafyGreenInlineCode
) as typeof LeafyGreenInlineCode;
const InlineKeyCode = withTheme(
  LeafyGreenInlineKeyCode
) as typeof LeafyGreenInlineKeyCode;
const Disclaimer = withTheme(
  LeafyGreenDisclaimer
) as typeof LeafyGreenDisclaimer;
const Overline = withTheme(LeafyGreenOverline) as typeof LeafyGreenOverline;
const Link = withTheme(
  LeafyGreenLink as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenLink>
  >
) as typeof LeafyGreenLink;

const Button = withTheme(
  LeafyGreenButton as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenButton>
  >
) as typeof LeafyGreenButton;
const Card: typeof LeafyGreenCard = withTheme(
  LeafyGreenCard as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenCard>
  >
) as typeof LeafyGreenCard;
const Checkbox = withTheme(
  LeafyGreenCheckbox as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenCheckbox>
  >
) as typeof LeafyGreenCheckbox;
const Code = withTheme(
  LeafyGreenCode as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenCode>
  >
) as typeof LeafyGreenCode;
const ConfirmationModal: typeof LeafyGreenConfirmationModal = withTheme(
  LeafyGreenConfirmationModal as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenConfirmationModal>
  >
) as typeof LeafyGreenConfirmationModal;
const IconButton: typeof LeafyGreenIconButton = withTheme(
  LeafyGreenIconButton as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenIconButton>
  >
) as typeof LeafyGreenIconButton;
const ModalFooter: typeof LeafyGreenModalFooter = withTheme(
  LeafyGreenModalFooter
) as typeof LeafyGreenModalFooter;
const Modal = withTheme(
  LeafyGreenModal as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenModal>
  >
) as typeof LeafyGreenModal;
const MarketingModal: typeof LeafyGreenMarketingModal = withTheme(
  LeafyGreenMarketingModal as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenMarketingModal>
  >
) as typeof LeafyGreenMarketingModal;
const RadioGroup: typeof LeafyGreenRadioGroup = withTheme(
  LeafyGreenRadioGroup as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenRadioGroup>
  >
) as typeof LeafyGreenRadioGroup;
const SegmentedControl = withTheme(
  LeafyGreenSegmentedControl
) as typeof LeafyGreenSegmentedControl;
const Select: typeof LeafyGreenSelect = withTheme(
  LeafyGreenSelect as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenSelect>
  >
) as typeof LeafyGreenSelect;
const Table = withTheme(LeafyGreenTable) as typeof LeafyGreenTable;
const Tabs = withTheme(
  LeafyGreenTabs as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenTabs>
  >
) as typeof LeafyGreenTabs;
const TextArea: typeof LeafyGreenTextArea = withTheme(LeafyGreenTextArea);
const TextInput: typeof LeafyGreenTextInput = withTheme(LeafyGreenTextInput);
const Toggle = withTheme(
  LeafyGreenToggle as React.ComponentType<
    React.ComponentProps<typeof LeafyGreenToggle>
  >
) as typeof LeafyGreenToggle;
const Label = withTheme(LeafyGreenLabel) as typeof LeafyGreenLabel;
const Description = withTheme(
  LeafyGreenDescription
) as typeof LeafyGreenDescription;
const Combobox = withTheme(LeafyGreenCombobox);
// 3. Export the leafygreen components.
export {
  AtlasLogoMark,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  Code,
  ConfirmationModal,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSeparator,
  Modal,
  ModalFooter,
  MarketingModal,
  MongoDBLogoMark,
  MongoDBLogo,
  Popover,
  RadioBox,
  RadioBoxGroup,
  Radio,
  RadioGroup,
  SegmentedControl,
  SegmentedControlOption,
  Select,
  Option,
  OptionGroup,
  Table,
  TableHeader,
  Row,
  Cell,
  Tab,
  Tabs,
  TextArea,
  TextInput,
  Toast,
  ToastVariant,
  Toggle,
  H1,
  H2,
  H3,
  Subtitle,
  Body,
  InlineCode,
  InlineKeyCode,
  Disclaimer,
  Overline,
  Label,
  Link,
  Description,
  Combobox,
  ComboboxOption,
  ComboboxGroup,
};
