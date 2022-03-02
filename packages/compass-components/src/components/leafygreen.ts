import { withTheme } from '../hooks/use-theme';

// This file exports `@leafygreen-ui` components and wraps some of
// them with a listener to Compass' theme in the react context.

// 1. Import the components we use from leafygreen.
import { default as Badge } from '@leafygreen-ui/badge';
import { default as Banner } from '@leafygreen-ui/banner';
import { default as LeafyGreenButton } from '@leafygreen-ui/button';
import { default as LeafyGreenCheckbox } from '@leafygreen-ui/checkbox';
import { default as LeafyGreenCard } from '@leafygreen-ui/card';
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
  Footer as LeafyGreenFooter,
} from '@leafygreen-ui/modal';
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
import { default as Toast } from '@leafygreen-ui/toast';
import { default as LeafyGreenToggle } from '@leafygreen-ui/toggle';
import { default as LeafyGreenTooltip } from '@leafygreen-ui/tooltip';
import {
  H1,
  H2,
  H3,
  Subtitle,
  Body,
  InlineCode,
  InlineKeyCode,
  Disclaimer,
  Overline,
  Label as LeafyGreenLabel,
  Link,
  Description as LeafyGreenDescription,
} from '@leafygreen-ui/typography';

// 2. Wrap the components that accept darkMode with Compass' theme.
const Button = withTheme(LeafyGreenButton);
const Card = withTheme(LeafyGreenCard);
const Checkbox = withTheme(LeafyGreenCheckbox);
const ConfirmationModal = withTheme(LeafyGreenConfirmationModal);
const IconButton = withTheme(LeafyGreenIconButton);
const Footer = withTheme(LeafyGreenFooter);
const Modal = withTheme(LeafyGreenModal);
const RadioGroup = withTheme(LeafyGreenRadioGroup);
const SegmentedControl = withTheme(LeafyGreenSegmentedControl);
const Select = withTheme(LeafyGreenSelect);
const Table = withTheme(LeafyGreenTable);
const Tabs = withTheme(LeafyGreenTabs);
const TextArea = withTheme(LeafyGreenTextArea);
const TextInput = withTheme(LeafyGreenTextInput);
const Toggle = withTheme(LeafyGreenToggle);
const Tooltip = withTheme(LeafyGreenTooltip);
const Label = withTheme(LeafyGreenLabel);
const Description = withTheme(LeafyGreenDescription);

// 3. Export the leafygreen components.
export {
  AtlasLogoMark,
  Badge,
  Banner,
  Button,
  Card,
  Checkbox,
  ConfirmationModal,
  Icon,
  IconButton,
  Footer,
  Menu,
  MenuItem,
  MenuSeparator,
  Modal,
  MongoDBLogoMark,
  MongoDBLogo,
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
  Toggle,
  Tooltip,
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
};
