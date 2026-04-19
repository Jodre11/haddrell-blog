declare module '@pagefind/default-ui' {
    interface PagefindUIOptions {
        element: string | HTMLElement;
        bundlePath?: string;
        showImages?: boolean;
        showSubResults?: boolean;
        excerptLength?: number;
        resetStyles?: boolean;
        debounceTimeoutMs?: number;
        processTerm?: (term: string) => string;
        processResult?: (result: unknown) => unknown;
        translations?: Record<string, string>;
    }

    export class PagefindUI {
        constructor(options: PagefindUIOptions);
    }
}

declare module '@pagefind/default-ui/css/ui.css';
