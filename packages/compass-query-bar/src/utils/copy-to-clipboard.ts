export const copyToClipboard = (content: string) => {
  void navigator.clipboard.writeText(content);
};
