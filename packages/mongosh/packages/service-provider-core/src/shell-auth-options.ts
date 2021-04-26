export default interface ShellAuthOptions {
  user: string;
  pwd: string;
  mechanism?: string;
  digestPassword?: boolean;
  authDb?: string;
}
