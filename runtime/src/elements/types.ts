export interface ElementRegistryItem<T extends HTMLElement = HTMLElement> {
    setup: () => void | Promise<void>;
    element: new () => T;
    tag_name: string;
}
