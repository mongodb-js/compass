export type OutputLanguage =
  | 'java'
  | 'javascript'
  | 'csharp'
  | 'python'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'php';

export function outputLanguageToCodeLanguage(language: OutputLanguage) {
  if (language === 'csharp') {
    return 'C#';
  }

  if (language === 'javascript') {
    return 'Node';
  }

  if (language === 'php') {
    return 'PHP';
  }

  return (language as string)[0].toUpperCase() + (language as string).slice(1);
}

export function codeLanguageToOutputLanguage(language: string): OutputLanguage {
  if (language === 'cs') {
    return 'csharp';
  }

  return language as OutputLanguage;
}
