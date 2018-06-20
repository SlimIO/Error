# Error
Slim.IO Opinionated Error(s) handle/generator

> *warning* This implementation (solution) will cost Memory

## Features
- Load JSON (Errors Manifest) files safely
- Expose customised Error API.

## Getting Started

```bash
$ npm i @slimio/error
# or
$ yarn add @slimio/error
```

Each JSON files should be structure by following this interface
```ts
export interface Error {
    title: string;
    code?: string;
    description?: string;
    message: string;
}
```

They should be Array of `Error`.

## Roadmap

- Verify JSON file with JSON Schema validation
