export class AuthMechanismProperties {
  private properties: Record<string, string>;

  constructor(queryParam?: string | Record<string, string> | undefined | null) {
    if (typeof queryParam === 'string') {
      this.properties = queryParam
        ?.split(',')
        .map((str) => str.split(':'))
        .reduce((acc, [k, v]) => {
          return { [k]: v, ...acc };
        }, {});
    } else {
      this.properties = queryParam ?? {};
    }
  }

  delete(key: string): void {
    delete this.properties[key];
  }

  get(key: string): string {
    return this.properties[key];
  }

  set(key: string, value: string): void {
    this.properties[key] = value;
  }

  has(key: string): boolean {
    return !!this.properties[key];
  }

  toString(): string {
    return Object.entries(this.properties)
      .map((entry) => entry.join(':'))
      .join(',');
  }
}
