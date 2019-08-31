
export declare class SlimIOError extends Error {
    toJSON(): {
        name: string;
        message: string;
        stack: string;
    }
}

export declare class CallbackArgumentType extends SlimIOError {}
export declare class CallbackNotFound extends SlimIOError {
    constructor(callbackName: string);
}
export declare class RequiredArgument extends SlimIOError {
    constructor(argName: string);
}

export function isSlimIOError(obj: any): boolean;
