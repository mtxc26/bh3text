declare module 'virtual:css-injected-by-js' {
  export interface InjectCSSOptions {
    target?: HTMLElement | ShadowRoot;
  }

  export function injectCSS(options?: InjectCSSOptions): void;
  export function removeCSS(): void;
  export function getRawCSS(): string;
}
