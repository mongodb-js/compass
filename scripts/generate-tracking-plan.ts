import path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';

type PropertyInfo = {
  name: string;
  comment: string;
  type?: string;
  required: boolean;
};

type TelemetryEventInfo = {
  typeAlias: string;
  category: string;
  name: string;
  comment: string;
  props: PropertyInfo[];
};

const TELEMETRY_EVENTS_SOURCE_FILE = path.resolve(
  __dirname,
  '..',
  'packages/compass-telemetry/src/telemetry-events.ts'
);

function main() {
  const originalSource = ts.createSourceFile(
    TELEMETRY_EVENTS_SOURCE_FILE,
    fs.readFileSync(TELEMETRY_EVENTS_SOURCE_FILE, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );

  // get all of the event types names from the original source
  const eventTypeNames = getTelemetryEventNames(originalSource);

  // for each event and for the IdentifyTraits add a new type `Reduced${typeName}`
  // with any intersection and reference types resolved.
  const { sourceFile: sourceFileWithReducedTypes, checker } =
    getSourceWithReducedTypes(originalSource, eventTypeNames);

  // get event info from the modified sources
  const events = eventTypeNames.map((eventTypeName) =>
    parseTelemetryEventType(eventTypeName, sourceFileWithReducedTypes, checker)
  );

  const identify = parseTelemetryEventType(
    'IdentifyTraits',
    sourceFileWithReducedTypes,
    checker
  );

  // render the markdown plan
  const markdown = generateMarkdownPlan(events, identify);

  console.info(markdown);
}

main();

// --

function getTelemetryEventNames(sourceFile: ts.SourceFile): string[] {
  const eventNames: string[] = [];

  // find TelemetryEvent and collect all of the event type names in the union.
  ts.forEachChild(sourceFile, (node: ts.Node) => {
    if (
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === 'TelemetryEvent'
    ) {
      const type = node.type;

      if (!ts.isUnionTypeNode(type)) {
        throw new Error('TelemetryEvent is not a union type');
      }

      for (const typeElement of type.types) {
        if (
          ts.isTypeReferenceNode(typeElement) &&
          ts.isIdentifier(typeElement.typeName)
        ) {
          eventNames.push(typeElement.typeName.text);
        } else {
          throw new Error('Unexpected type in TelemetryEvent union');
        }
      }
    }
  });

  return eventNames;
}

function extractNamePropValue(
  node: ts.TypeAliasDeclaration,
  checker: ts.TypeChecker
) {
  const type = checker.getTypeAtLocation(node);
  const properties = type.getProperties();

  const nameProp = properties.find((prop) => prop.getName() === 'name');
  if (nameProp) {
    const nameType = checker.getTypeOfSymbolAtLocation(nameProp, node);

    if (nameType.isStringLiteral()) {
      return nameType.value;
    } else {
      return checker.typeToString(nameType); // for template literals
    }
  }

  throw new Error('Unable to extract type name');
}

function extractPayloadPropertiesAndComments(
  node: ts.TypeAliasDeclaration,
  checker: ts.TypeChecker
) {
  const props: PropertyInfo[] = [];

  const type = checker.getTypeAtLocation(node);
  const properties = type.getProperties();

  const payloadProp = properties.find((prop) => prop.getName() === 'payload');
  if (payloadProp) {
    const payloadType = checker.getTypeOfSymbolAtLocation(payloadProp, node);
    payloadType.getProperties().forEach((prop) => {
      const propType = checker.getTypeOfSymbolAtLocation(prop, node);

      const isOptionalFlag = (prop.getFlags() & ts.SymbolFlags.Optional) !== 0;
      const allowsUndefinedInUnion =
        propType.isUnion() &&
        propType.types.some((type) => type.flags & ts.TypeFlags.Undefined);

      props.push({
        name: prop.getName(),
        type: checker.typeToString(
          checker.getTypeOfSymbolAtLocation(prop, node),
          undefined,
          ts.TypeFormatFlags.NoTruncation
        ),
        comment: ts.displayPartsToString(prop.getDocumentationComment(checker)),
        required: !isOptionalFlag && !allowsUndefinedInUnion,
      });
    });
  }

  return props;
}

function parseTelemetryEventType(
  eventTypeName: string,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker
): TelemetryEventInfo {
  let originalType: ts.TypeAliasDeclaration | undefined = undefined;
  let targetResolvedType: ts.TypeAliasDeclaration | undefined = undefined;

  sourceFile.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === eventTypeName) {
      originalType = node;
      return;
    }

    if (
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === `Resolved${eventTypeName}`
    ) {
      targetResolvedType = node;
    }
  });

  if (!originalType) {
    throw new Error('cannot find originalType');
  }

  if (!targetResolvedType) {
    throw new Error('cannot find targetResolvedType');
  }

  const originalSymbol = checker.getSymbolAtLocation(
    (originalType as ts.TypeAliasDeclaration).name
  );

  const comment = originalSymbol
    ? ts.displayPartsToString(originalSymbol.getDocumentationComment(checker))
    : '';

  const categoryTag = ts
    .getJSDocTags(originalType)
    .find((value: ts.JSDocTag) => {
      return value.tagName.getText() === 'category';
    });

  return {
    typeAlias: (originalType as ts.TypeAliasDeclaration)?.name.text,
    category: categoryTag?.comment?.toString() ?? 'Other',
    name: extractNamePropValue(targetResolvedType, checker),
    comment: comment,
    props: extractPayloadPropertiesAndComments(targetResolvedType, checker),
  };
}

function getSourceWithReducedTypes(
  originalSource: ts.SourceFile,
  eventTypeNames: string[]
) {
  // Creates a new source file with new types for the events with a "squashed" payload,
  // resolving any type reference to basic types.
  // We then use the type checker to read the simplified types for each property.
  // This allows us to write event types more freely, refactoring common interfaces, while
  // being able to generate a readable tracking plan.

  const modifiedSourceText = `
type ResolveType<T> = T extends (...args: infer A) => infer R
? (...args: ResolveType<A>) => ResolveType<R>
: T extends object
? T extends infer O
  ? { [K in keyof O]: ResolveType<O[K]> }
  : never
: T;

${originalSource.text}

type ResolvedIdentifyTraits = {
  name: 'Identify Traits',
  payload: ResolveType<IdentifyTraits>
};

  ${eventTypeNames
    .map((nodeName: string) => {
      return `
type Resolved${nodeName} = {
  name: ${nodeName}['name'],
  payload: ResolveType<${nodeName}['payload']>
};
    `;
    })
    .join('\n')}
  `;

  const sourceFile = ts.createSourceFile(
    'inMemoryFile.ts',
    modifiedSourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const compilerOptions = {
    // this is needed otherwise the type checker will remove undefined from any union
    strictNullChecks: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  host.getSourceFile = (fileName) =>
    fileName === 'inMemoryFile.ts' ? sourceFile : undefined;

  const program = ts.createProgram(['inMemoryFile.ts'], compilerOptions, host);
  const checker = program.getTypeChecker();
  return { sourceFile, checker };
}

function generateMarkdownPlan(
  events: TelemetryEventInfo[],
  identifyTraits: TelemetryEventInfo
) {
  const categoryNames = Array.from(
    new Set(events.map((e) => e.category))
  ).sort();

  const categoryEntries: [string, TelemetryEventInfo[]][] = categoryNames.map(
    (category) => {
      const categoryEvents = events
        .filter((e) => e.category === category)
        .sort();
      return [category, categoryEvents];
    }
  );

  const categories: [string, TelemetryEventInfo[]][] = [
    ['Identify', [identifyTraits]],
    ...categoryEntries,
  ];

  let toc = '';
  let eventsMarkdown = '';

  for (const [category, categoryEvents] of categories) {
    toc += `\n### ${category}\n`;

    eventsMarkdown += `\n## ${category}\n\n`;

    for (const event of categoryEvents) {
      const eventLink = `event--${event.typeAlias}`;

      toc += `- [${event.name}](#${eventLink})\n`;

      eventsMarkdown += `<a name="${eventLink}"></a>\n\n`;
      eventsMarkdown += `### ${event.name}\n\n`;
      eventsMarkdown += `${event.comment}\n\n`;

      if (event.props.length > 0) {
        eventsMarkdown += `**Properties**:\n\n`;
        for (const prop of event.props) {
          eventsMarkdown += `- **${prop.name}** (${
            prop.required ? 'required' : 'optional'
          }): \`${prop.type || 'unknown'}\`\n`;
          if (prop.comment) {
            eventsMarkdown += `  - ${prop.comment}\n`;
          }
        }
        eventsMarkdown += '\n';
      }
    }
  }

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const markdown = `
# Compass Tracking Plan

> [!NOTE]
> This plan represents the tracking plan for the current branch / commit that 
> you have selected (\`main\` by default), it might not be released yet. To find
> the tracking plan for the specific Compass version you can use the following
> URL: https://github.com/mongodb-js/compass/blob/v<compass version>/docs/tracking-plan.md

Generated on ${formattedDate}

## Table of Contents
${toc}

${eventsMarkdown}
`;

  return markdown;
}
