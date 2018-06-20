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

Each JSON files should be created by respecting the following SCHEMA :
```json
{
    "type": "array",
    "items": {
        "type": "object",
        "required": ["title", "message", "code"],
        "additionalProperties": false,
        "properties": {
            "title": {
                "type": "string",
                "description": "Error title"
            },
            "description": {
                "type": "string",
                "description": "Error complete description"
            },
            "message": {
                "type": "string",
                "description": "Error message"
            },
            "code": {
                "type": "string",
                "description": "Error unique code"
            },
            "criticity": {
                "type": "string",
                "description": "Error criticity",
                "enum": [
                    "Critical",
                    "Major",
                    "Minor",
                    "Debug"
                ],
                "default": "Major"
            }
        }
    }
}
```
