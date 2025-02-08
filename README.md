# SQLite Context Server

A model context protocol server for SQLite databases, designed for use with the Zed editor's AI assistant.

This package provides the Node.js server implementation for the [sqlite-context-server](https://github.com/dj0le/sqlite-context-server) Zed extension.

## Description

This server implements the Model Context Protocol for SQLite databases, allowing Zed's AI assistant to:
- Query table schemas
- List available tables
- Execute read-only SQL queries
- Provide auto-completion for table names

## Installation

This package is typically installed automatically by the Zed sqlite-context-server extension. However, if you need to install it manually:

```bash
npm install @yourusername/sqlite-context-server
```

## Usage

The server expects a `DATABASE_PATH` environment variable pointing to your SQLite database file:

```bash
export DATABASE_PATH=/path/to/your/database.sqlite
node index.mjs
```

## API

The server implements the following Model Context Protocol endpoints:

- `GET /resources` - Lists available tables
- `GET /schema/:table` - Returns schema for specified table
- Tool: `sqlite-schema` - Returns table schema information
- Tool: `query` - Executes read-only SQL queries
- Prompt: `/sqlite-schema` - Interactive schema lookup

## Development

To develop or modify this server:

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Make your changes
4. Test with a local SQLite database:
```bash
DATABASE_PATH=./test.db node index.mjs
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Related

- [sqlite-context-server](https://github.com/dj0le/sqlite-context-server) - The Zed extension that uses this package
- [Model Context Protocol](https://github.com/zed-industries/model-context-protocol) - Protocol specification
