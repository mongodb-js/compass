import { promises as fs } from 'fs';
import { compile } from 'handlebars';
import * as path from 'path';
import ts from 'typescript';
import * as ux from './ux';

type PackageError = { code: string, documentation: string };
type PackageErrors = { package: string, errors: PackageError[] };

const MONGOSH_ERRORS_DOC_TAG = 'mongoshErrors';

(async function() {
  const pathToPackages = path.resolve(process.argv[process.argv.length - 2]);
  const pathToOutput = path.resolve(process.argv[process.argv.length - 1]);
  if (!pathToPackages || !(await isDirectory(pathToPackages))) {
    ux.fatal('Could not find given packages directory:', pathToPackages);
    return;
  }

  const packageErrors: PackageErrors[] = [];
  const seenCodes = new Map<String, PackageError>();
  let hasDuplicates = false;

  const packages = await collectPackages(pathToPackages);
  for (const packagePath of packages) {
    const dirName = path.basename(packagePath);
    ux.info(`Processing ${dirName}...`);
    const pe = await processPackage(packagePath);
    if (pe) {
      packageErrors.push(pe);
      ux.note(`Found ${pe.errors.length} mongosh errors.\n`);

      for (const e of pe.errors) {
        if (seenCodes.has(e.code)) {
          ux.error(
            `Duplicate code: ${e.code}\n`,
            `\tExisting documentation: ${seenCodes.get(e.code)?.documentation}\n`,
            `\tNew documentation:      ${e.documentation}\n`,
          );
          hasDuplicates = true;
        } else {
          seenCodes.set(e.code, e);
        }
      }
    } else {
      ux.quiet('No mongosh errors found.\n');
    }
  }

  if (hasDuplicates) {
    ux.fatal('There were duplicate error codes, check output.');
    return;
  }

  await renderErrorOverview(pathToOutput, packageErrors);

  ux.success('👏👏👏👏');
  ux.success(`Wrote generated overview page to: ${pathToOutput}`);
  ux.success('👏👏👏👏');
})().catch(err => process.nextTick(() => { throw err; }));

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(path);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(path);
    return stat.isFile();
  } catch (e) {
    return false;
  }
}

async function collectPackages(pathToPackages: string): Promise<string[]> {
  const dirs = await fs.readdir(pathToPackages);
  const packages = await Promise.all(dirs.map(async dir => {
    const packageJsonPath = path.resolve(pathToPackages, dir, 'package.json');
    const tsconfigPath = path.resolve(pathToPackages, dir, 'tsconfig.json');
    if ((await isFile(tsconfigPath)) && (await isFile(packageJsonPath))) {
      return path.resolve(pathToPackages, dir);
    }
    return undefined;
  }));
  return packages.filter(d => !!d) as string[];
}

async function processPackage(pathToPackage: string): Promise<PackageErrors | undefined> {
  const packageJsonContent = await fs.readFile(
    path.resolve(pathToPackage, 'package.json'),
    { encoding: 'utf-8' }
  );
  const packageName = (JSON.parse(packageJsonContent) as any).name;

  const tsProgram = await createTsProgram(pathToPackage);
  if (!tsProgram) {
    return undefined;
  }

  const errors: PackageError[] = await extractErrors(pathToPackage, tsProgram);
  if (!errors || !errors.length) {
    return undefined;
  }

  return {
    package: packageName,
    errors
  };
}

async function createTsProgram(pathToPackage: string): Promise<ts.Program | undefined> {
  const tsconfigPath = ts.findConfigFile(pathToPackage, ts.sys.fileExists);
  if (!tsconfigPath) {
    ux.error(`Could not locate tsconfig.json in ${pathToPackage}`);
    return undefined;
  }

  const tsconfigContent = ts.readJsonConfigFile(tsconfigPath, ts.sys.readFile);
  const tsconfig = ts.parseJsonConfigFileContent(
    tsconfigContent,
    ts.sys,
    path.resolve(pathToPackage)
  );

  return ts.createProgram({
    options: tsconfig.options,
    rootNames: tsconfig.fileNames
  });
}

async function extractErrors(pathToPackage: string, program: ts.Program): Promise<PackageError[]> {
  const errors: PackageError[] = [];

  const checker = program.getTypeChecker();
  program.getSourceFiles()
    .filter(sf => isRelevantSourceFileInPackage(pathToPackage, sf))
    .forEach(sf => ts.forEachChild(sf, visit));

  function visit(node: ts.Node): void {
    const enumData = tryExtractMongoshErrorsEnumDeclaration(checker, node);
    if (!enumData) {
      return;
    }
    const { enumName, enumDeclaration } = enumData;

    enumDeclaration.members.forEach(m => {
      const memberName = m.name.getText();
      if (!m.initializer || !ts.isStringLiteral(m.initializer)) {
        ux.error(`Enum value ${enumName}.${memberName} must have a string literal as initializer`);
        return;
      }

      const memberSymbol = checker.getSymbolAtLocation(m.name);
      const memberDoc = ts.displayPartsToString(memberSymbol?.getDocumentationComment(checker) || []);

      const memberValue = m.initializer.text;
      errors.push({
        code: memberValue,
        documentation: memberDoc
      });
    });
  }

  return errors;
}

function isRelevantSourceFileInPackage(pathToPackage: string, sf: ts.SourceFile): boolean {
  if (sf.isDeclarationFile) {
    return false;
  }

  return path.resolve(sf.fileName).startsWith(path.resolve(pathToPackage));
}

function tryExtractMongoshErrorsEnumDeclaration(checker: ts.TypeChecker, node: ts.Node): { enumName: string, enumDeclaration: ts.EnumDeclaration } | undefined {
  if (!ts.isEnumDeclaration(node)) {
    return undefined;
  }

  const enumSymbol = checker.getSymbolAtLocation(node.name);
  if (!enumSymbol) {
    ux.warning('Found enum but could not correlate with symbol:', node.name.getText());
    return undefined;
  }

  const docTags = enumSymbol.getJsDocTags();
  if (!docTags.find(t => t.name === MONGOSH_ERRORS_DOC_TAG)) {
    return undefined;
  }

  const enumName = enumSymbol.getName();
  const enumDeclaration = enumSymbol.valueDeclaration as ts.EnumDeclaration;
  return { enumName, enumDeclaration };
}

async function renderErrorOverview(outputPath: string, packageErrors: PackageErrors[]): Promise<void> {
  const templateContent = await fs.readFile(
    path.resolve(__dirname, 'error-overview.tmpl.md'),
    { encoding: 'utf-8' }
  );

  const template = compile(templateContent);
  const output = template({
    packages: packageErrors
  });

  await fs.writeFile(
    outputPath,
    output,
    { encoding: 'utf-8' }
  );
}
