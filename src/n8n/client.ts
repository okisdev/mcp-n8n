/**
 * n8n API Client
 *
 * A client for interacting with the n8n REST API.
 */

import type {
  Env,
  Workflow,
  WorkflowListResponse,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ListWorkflowsOptions,
  ApiErrorResponse,
  HealthCheckResponse,
} from './types';

export class N8nClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(env: Env) {
    this.baseUrl = env.N8N_API_URL.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = env.N8N_API_KEY;
  }

  /**
   * Make an authenticated request to the n8n API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'X-N8N-API-KEY': this.apiKey,
      Accept: 'application/json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      throw new Error(
        errorBody.message ||
          `n8n API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Check n8n API connectivity
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      // Try to list workflows with limit 1 to verify connectivity
      await this.request<WorkflowListResponse>('GET', '/workflows?limit=1');
      return {
        status: 'ok',
        message: 'Successfully connected to n8n API',
        n8nUrl: this.baseUrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        n8nUrl: this.baseUrl,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * List all workflows
   */
  async listWorkflows(options?: ListWorkflowsOptions): Promise<WorkflowListResponse> {
    const params = new URLSearchParams();

    if (options?.active !== undefined) {
      params.append('active', String(options.active));
    }
    if (options?.tags) {
      params.append('tags', options.tags);
    }
    if (options?.name) {
      params.append('name', options.name);
    }
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    if (options?.cursor) {
      params.append('cursor', options.cursor);
    }

    const queryString = params.toString();
    const endpoint = `/workflows${queryString ? `?${queryString}` : ''}`;

    return this.request<WorkflowListResponse>('GET', endpoint);
  }

  /**
   * Get a workflow by ID
   */
  async getWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>('GET', `/workflows/${id}`);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: CreateWorkflowRequest): Promise<Workflow> {
    return this.request<Workflow>('POST', '/workflows', workflow);
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, workflow: UpdateWorkflowRequest): Promise<Workflow> {
    // First get the current workflow to merge with updates
    const current = await this.getWorkflow(id);

    const updated = {
      ...current,
      ...workflow,
      nodes: workflow.nodes ?? current.nodes,
      connections: workflow.connections ?? current.connections,
    };

    return this.request<Workflow>('PUT', `/workflows/${id}`, updated);
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>('DELETE', `/workflows/${id}`);
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>('POST', `/workflows/${id}/activate`);
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>('POST', `/workflows/${id}/deactivate`);
  }
}
