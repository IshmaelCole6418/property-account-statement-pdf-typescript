import assert from "node:assert/strict";
import { statementSchema, statementMarkdown, totalAmount } from "../src/statement_service.js";

const input = statementSchema.parse({
  accountId: "acct-17",
  tenantName: "Lee Chen",
  period: "2026-08",
  lines: [{ label: "Rent", amount: 1200 }, { label: "Water", amount: 34.5 }],
  maintenanceRequests: ["leak-2"],
  tenantDocuments: ["lease.pdf"],
  inspectionReminders: ["annual"]
});

assert.equal(totalAmount(input), 1234.5);
assert.match(statementMarkdown(input), /\*\*1234\.50\*\*/);
assert.throws(() => statementSchema.parse({ ...input, lines: [] }));
console.log("statement decision test passed");
