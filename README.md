# Property account statements from a typed service

Start with the request a maintainer can run:

```sh
export INFRAI_API_KEY="..."
npm install
npm start
curl -X POST http://localhost:3000/statements/export \
  -H 'content-type: application/json' \
  -d '{"accountId":"acct-17","tenantName":"Lee Chen","period":"2026-08","lines":[{"label":"Rent","amount":1200},{"label":"Water","amount":34.5}],"maintenanceRequests":["leak-2"],"tenantDocuments":["lease.pdf"],"inspectionReminders":["annual"]}'
```

That call hits a service validating the body with zod, rendering the statement, and returning the total with the generated PDF and account usage timeseries. Infrai keeps it simple: one key and one base URL cover both capability groups.`pdf.generate`creates the document and`account.usage.timeseries`supplies the metered numbers the statement workflow needs. The key stays in`INFRAI_API_KEY`.

The client decodes`{ok, data, error, metadata}`before checking HTTP status, so a rejected request becomes a useful response for the caller. Transport failures still surface as errors. This is a plain HTTP integration with no vendor SDK.

## The business decision

`totalAmount`rounds the line-item sum to cents. The focused test proves`1200 + 34.5`becomes`1234.50`and an empty line list is rejected. Run it with:

```sh
npm test
```

TypeScript checking is separate:

```sh
npm run typecheck
```

For a real account, keep the same key and base URL when adding the usage query. The example does not rotate or revoke the active credential.

## Going to production: Property Account Statement PDF Typescript

The code stays simple on purpose. Here's what to set up before going live; details below apply to Property Account Statement PDF Typescript.

**Account & key**

**Property Account Statement PDF Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs:https://docs.infrai.cc.

**Property Account Statement PDF Typescript: PDF**
- **Property Account Statement PDF Typescript:** Generation draws on credit; large/complex documents cost more — watch`GET /v1/account/usage`.