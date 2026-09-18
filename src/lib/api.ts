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
  UpdateProfileInput,
} from "@/types/domain";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new Error("Unable to reach the ClientFlow API. Confirm it is running.");
  }

  const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Request failed" : payload.error.message;
    throw new Error(message);
  }

  return payload.data;
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
    list: () => request<Project[]>("/projects"),
    create: (input: CreateProjectInput) =>
      request<Project>("/projects", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateProjectInput>) =>
      request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/projects/${id}`, { method: "DELETE" }),
  },
  tasks: {
    list: () => request<Task[]>("/tasks"),
    create: (input: CreateTaskInput) =>
      request<Task>("/tasks", { method: "POST", body: JSON.stringify(input) }),
    update: (id: string, input: Partial<CreateTaskInput>) =>
      request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: string) => request<{ id: string }>(`/tasks/${id}`, { method: "DELETE" }),
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
};
