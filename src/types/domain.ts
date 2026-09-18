export type ClientStatus = "active" | "onboarding" | "paused" | "archived";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type InvoiceStatus = "draft" | "sent" | "paid";

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: ClientStatus;
  timezone: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  assignee: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  notes: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  role?: string;
  companyName?: string;
  avatarUrl?: string;
}

export interface CreateClientInput {
  name: string;
  email: string;
  company: string;
  phone: string;
  status?: ClientStatus;
  timezone?: string;
  industry?: string;
}

export interface CreateProjectInput {
  clientId: string;
  name: string;
  description: string;
  status?: ProjectStatus;
  budget: number;
  currency?: string;
  startDate: string;
  endDate: string;
}

export interface CreateTaskInput {
  title: string;
  projectId: string;
  assignee?: string;
  status?: TaskStatus;
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  taxRate?: number;
  notes?: string;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    rate: number;
  }>;
  status?: InvoiceStatus;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export const TASK_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To do" },
  { id: "in_progress", title: "In progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];
