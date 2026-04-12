export interface FixModule {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  matches(url: URL): boolean;
  install(root: Document): FixDisposable;
}

export interface FixDisposable {
  dispose(): void;
}
