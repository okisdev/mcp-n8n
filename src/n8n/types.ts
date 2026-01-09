/**
 * n8n API Types
 */

// Environment bindings for Cloudflare Workers
export interface Env {
  N8N_API_URL: string;
  N8N_API_KEY: string;
}

// Workflow Node
export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  disabled?: boolean;
  notes?: string;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
}

// Workflow Connection
export interface WorkflowConnection {
  node: string;
  type: string;
  index: number;
}

// Workflow Connections Object
export interface WorkflowConnections {
  [nodeName: string]: {
    main?: WorkflowConnection[][];
  };
}

// Workflow Settings
export interface WorkflowSettings {
  saveExecutionProgress?: boolean;
  saveManualExecutions?: boolean;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  executionTimeout?: number;
  timezone?: string;
  executionOrder?: 'v0' | 'v1';
  errorWorkflow?: string;
}

// Workflow Tag
export interface WorkflowTag {
  id: string;
  name: string;
}

// Workflow
export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  settings?: WorkflowSettings;
  staticData?: unknown;
  tags?: WorkflowTag[];
  createdAt: string;
  updatedAt: string;
}

// Workflow List Item (simplified for list response)
export interface WorkflowListItem {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: WorkflowTag[];
}

// Workflow List Response
export interface WorkflowListResponse {
  data: WorkflowListItem[];
  nextCursor?: string;
}

// Create Workflow Request
export interface CreateWorkflowRequest {
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  settings?: WorkflowSettings;
  staticData?: unknown;
  tags?: string[];
}

// Update Workflow Request
export interface UpdateWorkflowRequest {
  name?: string;
  nodes?: WorkflowNode[];
  connections?: WorkflowConnections;
  settings?: WorkflowSettings;
  staticData?: unknown;
  tags?: string[];
}

// List Workflows Options
export interface ListWorkflowsOptions {
  active?: boolean;
  tags?: string;
  name?: string;
  limit?: number;
  cursor?: string;
}

// API Error Response
export interface ApiErrorResponse {
  message: string;
  code?: string;
  description?: string;
}

// Health Check Response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  message: string;
  n8nUrl?: string;
  timestamp: string;
}
