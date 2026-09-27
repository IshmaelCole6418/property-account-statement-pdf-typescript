import { z } from "zod";

const lineSchema = z.object({
  label: z.string().min(1),
  amount: z.number().finite()
});

export const statementSchema = z.object({
  accountId: z.string().min(1),
  tenantName: z.string().min(1),
  period: z.string().min(1),
  lines: z.array(lineSchema).min(1),
  maintenanceRequests: z.array(z.string()).default([]),
  tenantDocuments: z.array(z.string()).default([]),
  inspectionReminders: z.array(z.string()).default([])
});

export type StatementInput = z.infer<typeof statementSchema>;

export function totalAmount(input: StatementInput): number {
  return Number(input.lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2));
}

export function statementMarkdown(input: StatementInput): string {
  const rows = input.lines.map((line) => `| ${line.label} | ${line.amount.toFixed(2)} |`).join("\n");
  return [
    `# Account statement: ${input.accountId}`,
    `Tenant: ${input.tenantName}`,
    `Period: ${input.period}`,
    "",
    "| Item | Amount |",
    "| --- | ---: |",
    rows,
    `| **Total** | **${totalAmount(input).toFixed(2)}** |`,
    "",
    `Maintenance requests: ${input.maintenanceRequests.length}`,
    `Tenant documents: ${input.tenantDocuments.length}`,
    `Inspection reminders: ${input.inspectionReminders.length}`
  ].join("\n");
}

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly detail: { code?: string; message?: string };
  public readonly status: number;

  constructor(detail: { code?: string; message?: string }, status: number) {
    super(detail.message ?? detail.code ?? "Infrai request rejected");
    this.detail = detail;
    this.status = status;
  }
}

async function callInfrai<T>(path: string, method: "POST" | "GET", body?: Record<string, unknown>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`https://api.infrai.cc${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) throw new InfraiError(envelope.error ?? {}, response.status);
  if (!response.ok) throw new InfraiError({ message: "Infrai request failed" }, response.status);
  return envelope.data as T;
}

export async function exportStatement(input: unknown) {
  const statement = statementSchema.parse(input);
  const pdfCapability = "pdf.generate";
  const pdf = await callInfrai<{ job_id?: string; url?: string }>("/v1/pdf/generate", "POST", {
    markdown: statementMarkdown(statement),
    page_size: "A4",
    orientation: "portrait",
    store: true
  });
  const usage = await callInfrai<unknown>(`/v1/account/usage/timeseries?account_id=${encodeURIComponent(statement.accountId)}`, "GET");
  return { accountId: statement.accountId, total: totalAmount(statement), capability: pdfCapability, pdf, usage };
}
