export default function redactCredentials(uri: string): string {
  const regexes = [
    // Username and password
    /(?<=\/\/)(.*)(?=\@)/g,
    // AWS IAM Session Token as part of query parameter
    /(?<=AWS_SESSION_TOKEN(:|%3A))([^,&]+)/
  ];
  regexes.forEach(r => {
    uri = uri.replace(r, '<credentials>');
  });
  return uri;
}
