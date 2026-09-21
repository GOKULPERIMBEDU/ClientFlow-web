export type ClientStatus = "active" | "onboarding" | "paused" | "archived";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "testing_qa"
  | "client_review"
  | "completed";
export type InvoiceStatus = "draft" | "sent" | "paid";
export type UserRole = "admin" | "lead" | "member";
export type TaskActionType = "created" | "status" | "assignee" | "comment" | "update" | "attachment" | "worklog";
export const DEFAULT_TASK_STATUS: TaskStatus = "backlog";

export function isAdminRole(role?: UserRole | string | null): boolean {
  return role === "admin" || role === "lead";
}

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
  assignedTeam: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  author: string;
  authorId: string;
  body: string;
  content: string;
  attachments: TaskAttachment[];
  mentions: string[];
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  type: TaskActionType;
  actionType: TaskActionType;
  userId: string;
  userName: string;
  author: string;
  oldValue: string;
  newValue: string;
  message: string;
  timestamp: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedProjects: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberInput {
  name: string;
  email: string;
  role?: UserRole;
  assignedProjects?: string[];
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  assignee: string;
  status: TaskStatus;
  description: string;
  dueDate: string;
  estimatedHours: number;
  spentHours: number;
  attachments: TaskAttachment[];
  comments: TaskComment[];
  activity: TaskActivity[];
  activityLog: TaskActivity[];
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
  assignedTeam?: string[];
}

export interface CreateTaskInput {
  title: string;
  projectId: string;
  assignee?: string;
  status?: TaskStatus;
  description?: string;
  dueDate?: string;
  estimatedHours?: number;
  spentHours?: number;
  actorId?: string;
  actorName?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  actor?: string;
  actorId?: string;
  actorName?: string;
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
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "testing_qa", title: "Testing / QA" },
  { id: "client_review", title: "Client Review" },
  { id: "completed", title: "Completed" },
];

export const STATUS_LABELS = Object.fromEntries(TASK_COLUMNS.map((column) => [column.id, column.title])) as Record<
  TaskStatus,
  string
>;

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as TaskStatus] ?? status;
}
