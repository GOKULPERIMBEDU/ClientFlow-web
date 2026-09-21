import { apiOrigin as originFromEnv, env } from "@/lib/env";
import type {
  ApiFailure,
  ApiSuccess,
  Client,
  CreateClientInput,
  CreateInvoiceInput,
  CreateProjectInput,
  CreateTaskInput,
  Invoice,
  Profile,
  Project,
  Task,
  TeamMember,
  CreateTeamMemberInput,
  UpdateProfileInput,
  UpdateTaskInput,
} from "@/types/domain";

export function apiOrigin(): string {
  return originFromEnv();
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${apiOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

function requireApiBaseUrl(): string {
  if (!env.apiBaseUrl) {
    throw new Error("API base URL is not configured. Set VITE_API_BASE_URL in your environment.");
  }
  return env.apiBaseUrl;
}

function connectionError(): Error {
  return new Error(
    env.apiBaseUrl
      ? `Unable to connect to the API at ${env.apiBaseUrl}.`
      : "API base URL is not configured. Set VITE_API_BASE_URL in your environment.",
  );
}

export interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

async function parsePayload<T>(response: Response): Promise<T> {
  let payload: ApiSuccess<T> | ApiFailure;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    throw connectionError();
  }

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Request failed" : payload.error.message;
    throw new Error(message);
  }

  return payload.data;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = requireApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw connectionError();
  }

  return parsePayload<T>(response);
}

async function uploadRequest<T>(path: string, body: FormData): Promise<T> {
  const baseUrl = requireApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      body,
      cache: "no-store",
    });
  } catch {
    throw connectionError();
  }

  return parsePayload<T>(response);
}

export const api = {
  clients: {
    list: () => request<Client[]>("/clients"),
    create: (input: CreateClientInput) =>
      request<Client>("/clients", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateClientInput>) =>
      request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/clients/${id}`, { method: "DELETE" }),
  },
  projects: {
    list: (userId?: string) => request<Project[]>(userId ? `/projects?userId=${encodeURIComponent(userId)}` : "/projects"),
    create: (input: CreateProjectInput) =>
      request<Project>("/projects", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateProjectInput>) =>
      request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/projects/${id}`, { method: "DELETE" }),
  },
  tasks: {
    list: (userId?: string) => request<Task[]>(userId ? `/tasks?userId=${encodeURIComponent(userId)}` : "/tasks"),
    get: (id: string) => request<Task>(`/tasks/${id}`),
    create: (input: CreateTaskInput) =>
      request<Task>("/tasks", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: UpdateTaskInput) =>
      request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    addComment: (
      id: string,
      input: {
        body?: string;
        content?: string;
        author?: string;
        actorId?: string;
        mentions?: string[];
        attachments?: { name: string; mimeType: string; contentBase64: string }[];
      },
    ) => request<Task>(`/tasks/${id}/comments`, { method: "POST", body: JSON.stringify(input) }),
    addAttachment: (
      id: string,
      input: { name: string; mimeType: string; contentBase64: string; actor?: string; actorId?: string; actorName?: string },
    ) => request<Task>(`/tasks/${id}/attachments`, { method: "POST", body: JSON.stringify(input) }),
    removeAttachment: (id: string, attachmentId: string) =>
      request<Task>(`/tasks/${id}/attachments/${attachmentId}`, { method: "DELETE" }),
    remove: (id: string) => request<{ id: string }>(`/tasks/${id}`, { method: "DELETE" }),
  },
  uploads: {
    create: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return uploadRequest<UploadedFile>("/uploads", body);
    },
  },
  invoices: {
    list: () => request<Invoice[]>("/invoices"),
    create: (input: CreateInvoiceInput) =>
      request<Invoice>("/invoices", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateInvoiceInput>) =>
      request<Invoice>(`/invoices/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/invoices/${id}`, { method: "DELETE" }),
  },
  profile: {
    get: () => request<Profile>("/profile"),
    update: (input: UpdateProfileInput) =>
      request<Profile>("/profile", { method: "PUT", body: JSON.stringify(input) }),
  },
  users: {
    list: () => request<TeamMember[]>("/users"),
    create: (input: CreateTeamMemberInput) =>
      request<TeamMember>("/users", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateTeamMemberInput>) =>
      request<TeamMember>(`/users/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/users/${id}`, { method: "DELETE" }),
  },
};
