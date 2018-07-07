/// <reference types="@types/node" />
/// <reference types="@types/es6-shim" />

/**
 * Error class definition
 */
declare class ErrorManager {
    constructor(filePath: string);
    static mapFromPayload(payload: ErrorManager.Error[]): Map<string, ErrorManager.Error>;

    errorFile: string;
    private _errors: Map<string, ErrorManager.Error>;
    readonly errors: Set<string>;
    readonly isInitialized: boolean;

    public load(): Promise<void>;
    public loadSync(): void;
    public get(errorTitle: string): ErrorMessage;
}

/**
 * Error namespace
 */
declare namespace ErrorManager {

    export declare class ErrorMessage {

    }

    export enum criticity {
        Critical,
        Major,
        Minor,
        Debug
    }

    export interface Error {
        title: string;
        code: string;
        handler: (args: string[] | { [k: string]: any }) => string;
        description?: string;
        message: string;
        criticity: ErrorManager.criticity
    }

}

export as namespace ErrorManager;
export = ErrorManager;
