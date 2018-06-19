/**
 * Error class definition
 */
declare class ErrorManager {
    constructor(filePath: string);
    static mapFromPayload(payload: Array): Map<string, ErrorManager.Error>;

    errorFile: string;
    errors: Map<string, ErrorManager.Error>;
    readonly isInitialized: boolean;

    public load(): Promise<void>;
    public loadSync(): void;
    public throw(errorTitle: string, args?: any): string;
}

/**
 * Error namespace
 */
declare namespace ErrorManager {

    export interface Error {
        title: string;
        code?: string;
        description?: string;
        message: string;
    }

}

export as namespace ErrorManager;
export = ErrorManager;
