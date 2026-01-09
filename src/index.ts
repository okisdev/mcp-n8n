/**
 * n8n MCP Server
 *
 * A Model Context Protocol (MCP) server for n8n workflow management.
 * Built with Hono and deployed on Cloudflare Workers.
 */

import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import packageJson from "../package.json" with { type: "json" };
import type { Env } from "./n8n/types";
import { registerTools } from "./tools";

type Bindings = {
	N8N_API_URL?: string;
	N8N_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for MCP clients
app.use("*", cors());

/**
 * Create and configure the MCP server
 */
function createMcpServer(env: Env): McpServer {
	const server = new McpServer({
		name: packageJson.name,
		version: packageJson.version,
	});

	// Register all n8n tools
	registerTools(server, env);

	return server;
}

// Root endpoint - server info
app.get("/", (c) => {
	return c.json({
		name: packageJson.name,
		version: packageJson.version,
		description: packageJson.description,
		endpoints: {
			mcp: "/mcp",
			health: "/health",
		},
		tools: [
			"health_check",
			"list_workflows",
			"get_workflow",
			"create_workflow",
			"update_workflow",
			"delete_workflow",
			"toggle_workflow",
		],
	});
});

// Health check endpoint
app.get("/health", async (c) => {
	// Support both Header and env vars (Header takes priority)
	const n8nApiUrl = c.req.header("X-N8N-API-URL") || c.env.N8N_API_URL;
	const n8nApiKey = c.req.header("X-N8N-API-KEY") || c.env.N8N_API_KEY;

	const configured = !!(n8nApiUrl && n8nApiKey);

	return c.json({
		status: configured ? "ok" : "unconfigured",
		mcp: "ready",
		n8n: {
			configured,
			url: n8nApiUrl ? n8nApiUrl.replace(/\/api\/v1\/?$/, "") : null,
		},
		timestamp: new Date().toISOString(),
	});
});

// MCP endpoint - handles all MCP protocol requests
app.all("/mcp", async (c) => {
	// Support both Header and env vars (Header takes priority)
	const n8nApiUrl = c.req.header("X-N8N-API-URL") || c.env.N8N_API_URL;
	const n8nApiKey = c.req.header("X-N8N-API-KEY") || c.env.N8N_API_KEY;

	// Check if n8n is configured
	if (!n8nApiUrl || !n8nApiKey) {
		return c.json(
			{
				jsonrpc: "2.0",
				error: {
					code: -32603,
					message:
						"n8n API not configured. Provide X-N8N-API-URL and X-N8N-API-KEY headers, or set environment variables.",
				},
				id: null,
			},
			500,
		);
	}

	// Create MCP server with config from headers or env
	const env: Env = {
		N8N_API_URL: n8nApiUrl,
		N8N_API_KEY: n8nApiKey,
	};
	const mcpServer = createMcpServer(env);
	const transport = new StreamableHTTPTransport();

	// Connect and handle request
	await mcpServer.connect(transport);
	return transport.handleRequest(c);
});

export default app;
