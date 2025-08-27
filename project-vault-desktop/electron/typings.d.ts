export { };

declare global {
    interface Window {
        api: {
            loadCache(): Promise<string[]>;
            fullSearch(): Promise<string[]>;
            pathToFileUrl(absPath: string): Promise<string>;
            chooseDir(): Promise<string | null>;
        };
    }
}
