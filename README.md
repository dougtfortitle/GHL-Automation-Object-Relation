# GHL-Automation-Object-Relation

**GHL-Automation-Object-Relation** is a production-ready middleware automation system that connects GoHighLevel (GHL) Contacts to Order custom objects using a file number extracted from contact custom fields. When a contact is created or updated in GHL, FileBridge automatically finds or creates the matching Order record and establishes the association — or you can trigger it manually via the API.

---

## How It Works

```
GHL Contact Created / Updated
          ↓
POST /api/webhook  (or manually: POST /api/create-custom-relation)
          ↓
Extract file number from contact custom fields (e.g. 25-16354)
          ↓
Normalize: trim → uppercase → strip spaces → regex validate (^\d{2}-\d{5}$)
          ↓
Search for Order record by file number in GHL Custom Objects
          ↓ (not found)
Create new Order record
          ↓
Check if Contact ↔ Order association already exists
          ↓ (not duplicate)
Create Association
          ↓
Return result in response body
```

---

## Project Structure

```
src/
  config/
    env.js                  → Zod-validated environment variables (fails on startup if missing)
    ghlClient.js            → Axios HTTP client + Bottleneck rate limiter (100 req/10s)
  middleware/
    auth.js                 → Header-based identity check (x-ghl-location-id, x-ghl-api-key)
    validate.js             → Generic Zod validation middleware factory
    rateLimit.js            → 500 requests/min cap (express-rate-limit)
  controllers/
    webhookController.js    → POST /api/webhook handler
    runController.js        → POST /api/create-custom-relation handler (manual trigger)
    contactController.js    → GET /api/contacts/:contactId handler
    orderController.js      → Order search, create, fetch handlers
    associationController.js→ Association check and create handlers
  services/
    contactService.js       → GHL contact fetch + email search
    orderService.js         → Order search, create, fetch by ID
    associationService.js   → Duplicate check + association creation
  flow/
    flow.js                 → Full orchestration logic (5-step pipeline)
    normalizer.js           → File number normalization + regex validation
  models/
    schemas.js              → All Zod schemas (webhook, run, order, association)
  logger/
    logger.js               → Winston structured logger (Console + file logs)
  routes/
    webhook.routes.js
    run.routes.js
    contact.routes.js
    order.routes.js
    association.routes.js
  app.js                    → Express app setup + route mounts
  server.js                 → HTTP server entry point (Vercel-compatible)
```

---

## API Reference

All endpoints require these headers:

```
x-ghl-location-id : <your GHL location ID>
x-ghl-api-key     : <your GHL API key>
```

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |

---

### Automation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhook` | GHL Workflow trigger (contact.created / contact.updated) |
| `POST` | `/api/create-custom-relation` | Manual full-flow trigger — accepts `contactId` or `email` |

**`POST /api/webhook` body:**
```json
{
  "contactId": "{{contact.id}}",
  "type": "contact.created",
  "locationId": "{{location.id}}",
  "customFields": []
}
```

**`POST /api/create-custom-relation` body:**
```json
{
  "contactId": "abc123",
  "fileNumber": "25-16354"
}
```
> Either `contactId` or `email` is required. `fileNumber` is optional — if omitted, it is extracted from the contact's custom fields automatically.

---

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/contacts/:contactId` | Fetch contact + extract file number |

---

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/orders/search` | Search order by file number |
| `POST` | `/api/orders` | Manually create an order |
| `GET` | `/api/orders/:orderId` | Fetch order by GHL record ID |

**`POST /api/orders/search` body:**
```json
{ "fileNumber": "25-16354" }
```

---

### Associations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/associations/check?contactId=X&orderId=Y` | Check if association exists |
| `POST` | `/api/associations` | Manually create an association |

**`POST /api/associations` body:**
```json
{
  "contactId": "abc123",
  "orderId": "xyz789"
}
```

---

## Response Format

**Success:**
```json
{
  "success": true,
  "status": "association_created",
  "contactId": "abc123",
  "fileNumber": "25-16354",
  "orderId": "xyz789",
  "timestamp": "2026-04-29T10:00:00.000Z"
}
```

**Error:**
```json
{
  "success": false,
  "status": "file_number_invalid",
  "contactId": "abc123",
  "error": "File number does not match pattern DD-DDDDD (e.g. 25-16354)",
  "timestamp": "2026-04-29T10:00:00.000Z"
}
```

**Possible `status` values:**

| Status | Meaning |
|--------|---------|
| `association_created` | ✅ Successfully linked |
| `duplicate_exists` | ⚠️ Association already exists |
| `file_number_missing` | ⚠️ No file number on contact |
| `file_number_invalid` | ⚠️ File number format invalid |
| `order_not_found` | ❌ Order search and creation both failed |
| `ghl_api_error` | ❌ Unexpected GHL API error |

---

## Environment Variables

Create a `.env` file in the project root:

```env
GHL_API_KEY=your-ghl-api-key
GHL_LOCATION_ID=your-location-id

FILE_NUMBER_ID=your-file-number-custom-field-id
ORDERS_OBJECT_KEY=custom_objects.orders
ORDERS_OBJECT_ID=your-orders-object-id
ORDERS_FILE_NUMBER_FIELD_KEY=your-orders-file-number-field-key
RECORD_ID=your-record-id
ASSOCIATION_ID=your-association-type-id

PORT=3000
```

---

## Setup & Run

**Requirements:** Node.js 18+, pnpm

```bash
# Install dependencies
pnpm install

# Development (auto-restart)
pnpm dev

# Production
pnpm start
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel

# Production
vercel --prod
```

Add all `.env` variables in **Vercel Dashboard → Project → Settings → Environment Variables**.

> File transport logging is automatically disabled on Vercel (ephemeral filesystem). All logs go to Vercel's built-in log console.

---

## GHL Workflow Setup

1. GHL Dashboard → **Automation** → **Workflows** → Create Workflow
2. **Trigger:** `Contact Created`
3. Add **Webhook** action:
   - **Method:** `POST`
   - **URL:** `https://your-domain.vercel.app/api/webhook`
   - **Headers:** `x-ghl-location-id` + `x-ghl-api-key`
   - **Body:**
     ```json
     {
       "contactId": "{{contact.id}}",
       "type": "contact.created",
       "locationId": "{{location.id}}",
       "customFields": []
     }
     ```
4. Click **"Send a Test Request"** to verify the connection
5. **Publish** the workflow

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `axios` | GHL API HTTP client |
| `bottleneck` | GHL rate limiting (100 req/10s) |
| `express-rate-limit` | Webhook rate limiting (500 req/min) |
| `zod` | Schema validation + env parsing |
| `winston` | Structured logging |
| `dotenv` | Environment variable loading |
| `nodemon` | Development auto-restart |
