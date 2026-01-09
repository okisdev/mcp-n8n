/**
 * MCP Tools for n8n
 *
 * Registers all MCP tools for n8n workflow management.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { N8nClient } from '../n8n/client';
import type { Env, CreateWorkflowRequest, UpdateWorkflowRequest } from '../n8n/types';

/**
 * Register all n8n MCP tools
 */
export function registerTools(server: McpServer, env: Env) {
  const client = new N8nClient(env);

  // Health Check Tool
  server.tool(
    'health_check',
    'Check n8n API connectivity and status',
    {},
    async () => {
      const result = await client.healthCheck();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // List Workflows Tool
  server.tool(
    'list_workflows',
    'List all workflows from n8n. Optionally filter by active status, tags, or name.',
    {
      active: z.boolean().optional().describe('Filter by active status'),
      tags: z.string().optional().describe('Filter by tags (comma-separated)'),
      name: z.string().optional().describe('Filter by workflow name'),
      limit: z.number().optional().describe('Maximum number of workflows to return'),
      cursor: z.string().optional().describe('Pagination cursor'),
    },
    async ({ active, tags, name, limit, cursor }) => {
      const result = await client.listWorkflows({ active, tags, name, limit, cursor });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Get Workflow Tool
  server.tool(
    'get_workflow',
    'Get a specific workflow by ID, including all nodes, connections, and settings.',
    {
      id: z.string().describe('The workflow ID'),
    },
    async ({ id }) => {
      const result = await client.getWorkflow(id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Create Workflow Tool
  server.tool(
    'create_workflow',
    'Create a new workflow in n8n. The workflow will be created in inactive state.',
    {
      name: z.string().describe('Name of the workflow'),
      nodes: z
        .array(
          z.object({
            id: z.string().describe('Unique node ID'),
            name: z.string().describe('Display name of the node'),
            type: z.string().describe('Node type (e.g., n8n-nodes-base.httpRequest)'),
            typeVersion: z.number().describe('Version of the node type'),
            position: z.array(z.number()).length(2).describe('Position [x, y]'),
            parameters: z.record(z.string(), z.unknown()).describe('Node parameters'),
            credentials: z.record(z.string(), z.unknown()).optional().describe('Credentials configuration'),
            disabled: z.boolean().optional().describe('Whether the node is disabled'),
          })
        )
        .describe('Array of workflow nodes'),
      connections: z
        .record(z.string(), z.unknown())
        .describe('Connections between nodes'),
      settings: z
        .object({
          saveExecutionProgress: z.boolean().optional(),
          saveManualExecutions: z.boolean().optional(),
          saveDataErrorExecution: z.enum(['all', 'none']).optional(),
          saveDataSuccessExecution: z.enum(['all', 'none']).optional(),
          executionTimeout: z.number().optional(),
          timezone: z.string().optional(),
        })
        .optional()
        .describe('Workflow settings'),
    },
    async ({ name, nodes, connections, settings }) => {
      const workflow: CreateWorkflowRequest = {
        name,
        nodes: nodes as CreateWorkflowRequest['nodes'],
        connections: connections as CreateWorkflowRequest['connections'],
        settings,
      };
      const result = await client.createWorkflow(workflow);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Update Workflow Tool
  server.tool(
    'update_workflow',
    'Update an existing workflow. You can update name, nodes, connections, or settings.',
    {
      id: z.string().describe('The workflow ID to update'),
      name: z.string().optional().describe('New name for the workflow'),
      nodes: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            typeVersion: z.number(),
            position: z.array(z.number()).length(2),
            parameters: z.record(z.string(), z.unknown()),
            credentials: z.record(z.string(), z.unknown()).optional(),
            disabled: z.boolean().optional(),
          })
        )
        .optional()
        .describe('Updated array of workflow nodes'),
      connections: z
        .record(z.string(), z.unknown())
        .optional()
        .describe('Updated connections between nodes'),
      settings: z
        .object({
          saveExecutionProgress: z.boolean().optional(),
          saveManualExecutions: z.boolean().optional(),
          saveDataErrorExecution: z.enum(['all', 'none']).optional(),
          saveDataSuccessExecution: z.enum(['all', 'none']).optional(),
          executionTimeout: z.number().optional(),
          timezone: z.string().optional(),
        })
        .optional()
        .describe('Updated workflow settings'),
    },
    async ({ id, name, nodes, connections, settings }) => {
      const workflow: UpdateWorkflowRequest = {};
      if (name) workflow.name = name;
      if (nodes) workflow.nodes = nodes as UpdateWorkflowRequest['nodes'];
      if (connections) workflow.connections = connections as UpdateWorkflowRequest['connections'];
      if (settings) workflow.settings = settings;

      const result = await client.updateWorkflow(id, workflow);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Delete Workflow Tool
  server.tool(
    'delete_workflow',
    'Permanently delete a workflow. This action cannot be undone.',
    {
      id: z.string().describe('The workflow ID to delete'),
    },
    async ({ id }) => {
      const result = await client.deleteWorkflow(id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Workflow "${result.name}" (${result.id}) has been deleted.`,
                deletedWorkflow: result,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Toggle Workflow Tool (Activate/Deactivate)
  server.tool(
    'toggle_workflow',
    'Activate or deactivate a workflow.',
    {
      id: z.string().describe('The workflow ID'),
      active: z.boolean().describe('Set to true to activate, false to deactivate'),
    },
    async ({ id, active }) => {
      const result = active
        ? await client.activateWorkflow(id)
        : await client.deactivateWorkflow(id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Workflow "${result.name}" is now ${result.active ? 'active' : 'inactive'}.`,
                workflow: result,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
