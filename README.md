# mcp-n8n

A Model Context Protocol (MCP) server for n8n workflow management. Built with Hono and deployed on Cloudflare Workers.

## Features

- List, get, create, update, and delete n8n workflows
- Activate/deactivate workflows
- Health check for n8n API connectivity
- Runs on Cloudflare Workers (edge deployment)
- Supports configuration via HTTP headers or environment variables

## MCP Tools

| Tool | Description |
|------|-------------|
| `health_check` | Check n8n API connectivity and status |
| `list_workflows` | List all workflows with optional filters |
| `get_workflow` | Get a specific workflow by ID |
| `create_workflow` | Create a new workflow |
| `update_workflow` | Update an existing workflow |
| `delete_workflow` | Delete a workflow |
| `toggle_workflow` | Activate or deactivate a workflow |

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure n8n credentials

You can configure n8n credentials in two ways:

#### Option A: HTTP Headers (Recommended for flexibility)

Pass credentials via HTTP headers on each request:

- `X-N8N-API-URL` - Your n8n instance API URL
- `X-N8N-API-KEY` - Your n8n API key

#### Option B: Environment Variables

Edit `wrangler.jsonc` and set your n8n API credentials:

```jsonc
{
  "vars": {
    "N8N_API_URL": "https://your-n8n-instance.com/api/v1",
    "N8N_API_KEY": "your-api-key"
  }
}
```

> **Note:** Headers take priority over environment variables. This allows you to deploy once and use different n8n instances per request.

To get your n8n API key:
1. Log into your n8n instance
2. Go to Settings > n8n API
3. Create a new API key

### 3. Development

```bash
pnpm dev
```

The server will start at `http://localhost:8787`.

### 4. Deploy

```bash
pnpm deploy
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Server info and available tools |
| `GET /health` | Health check |
| `POST /mcp` | MCP protocol endpoint |

## Usage with Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "n8n": {
      "url": "https://your-worker.workers.dev/mcp",
      "headers": {
        "X-N8N-API-URL": "https://your-n8n-instance.com/api/v1",
        "X-N8N-API-KEY": "your-api-key"
      }
    }
  }
}
```

## Usage with Cursor/VSCode

Add to your MCP settings:

```json
{
  "mcpServers": {
    "n8n": {
      "url": "http://localhost:8787/mcp",
      "headers": {
        "X-N8N-API-URL": "https://your-n8n-instance.com/api/v1",
        "X-N8N-API-KEY": "your-api-key"
      }
    }
  }
}
```

## Testing MCP Endpoint

List available tools:

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-URL: https://your-n8n-instance.com/api/v1" \
  -H "X-N8N-API-KEY: your-api-key" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

Call a tool:

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-URL: https://your-n8n-instance.com/api/v1" \
  -H "X-N8N-API-KEY: your-api-key" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{"name":"list_workflows","arguments":{}},
    "id":2
  }'
```

## License

MIT
