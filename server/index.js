import "dotenv/config";
import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const required = ["MONGODB_URI", "FIREBASE_SERVICE_ACCOUNT_JSON"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch {
  console.error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const mongo = new MongoClient(process.env.MONGODB_URI);
const database = mongo.db(process.env.MONGODB_DB_NAME || "startup-outreach-tracker");
const companies = database.collection("companies");
const app = express();
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: clientOrigins }));
app.use(express.json({ limit: "2mb" }));

const statuses = new Set(["not_contacted", "contacted", "replied", "meeting_scheduled"]);
const priorities = new Set(["high", "medium", "low"]);

function publicCompany(document) {
  const { _id, ownerId, ...company } = document;
  return company;
}

function isCompany(value) {
  return value
    && Number.isInteger(value.id)
    && typeof value.name === "string"
    && typeof value.contacted === "boolean"
    && statuses.has(value.status)
    && priorities.has(value.priority)
    && (typeof value.lastContactDate === "string" || value.lastContactDate === null)
    && typeof value.notes === "string";
}

function normalizeCompanies(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 10000 || !items.every(isCompany)) {
    return null;
  }

  const ids = new Set(items.map((item) => item.id));
  return ids.size === items.length ? items : null;
}

async function requireUser(request, response, next) {
  const [scheme, token] = (request.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ error: "A Firebase sign-in token is required." });
  }

  try {
    request.user = await getAuth().verifyIdToken(token);
    return next();
  } catch {
    return response.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

app.get("/api/health", (_request, response) => response.json({ ok: true }));

app.use("/api/companies", requireUser);

app.get("/api/companies", async (request, response, next) => {
  try {
    const result = await companies.find({ ownerId: request.user.uid }).sort({ id: 1 }).toArray();
    response.json({ companies: result.map(publicCompany) });
  } catch (error) {
    next(error);
  }
});

// Seeds a new account exactly once. The client sends its legacy Local Storage data
// when present; otherwise it sends the built-in starter list.
app.post("/api/companies/bootstrap", async (request, response, next) => {
  const initialCompanies = normalizeCompanies(request.body?.companies);
  if (!initialCompanies) {
    return response.status(400).json({ error: "A valid initial company list is required." });
  }

  try {
    const existing = await companies.countDocuments({ ownerId: request.user.uid }, { limit: 1 });
    if (existing === 0) {
      await companies.insertMany(initialCompanies.map((company) => ({ ...company, ownerId: request.user.uid })));
      return response.status(201).json({ companies: initialCompanies });
    }

    const result = await companies.find({ ownerId: request.user.uid }).sort({ id: 1 }).toArray();
    return response.json({ companies: result.map(publicCompany) });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/companies/:id", async (request, response, next) => {
  const id = Number(request.params.id);
  const updates = request.body;
  const allowed = ["contacted", "status", "priority", "lastContactDate", "notes"];
  const updateKeys = Object.keys(updates || {});
  const valid = Number.isInteger(id)
    && updateKeys.length > 0
    && updateKeys.every((key) => allowed.includes(key))
    && (updates.contacted === undefined || typeof updates.contacted === "boolean")
    && (updates.status === undefined || statuses.has(updates.status))
    && (updates.priority === undefined || priorities.has(updates.priority))
    && (updates.lastContactDate === undefined || typeof updates.lastContactDate === "string" || updates.lastContactDate === null)
    && (updates.notes === undefined || typeof updates.notes === "string");

  if (!valid) {
    return response.status(400).json({ error: "The requested company update is invalid." });
  }

  try {
    const result = await companies.findOneAndUpdate(
      { ownerId: request.user.uid, id },
      { $set: updates },
      { returnDocument: "after" },
    );
    if (!result) return response.status(404).json({ error: "Company not found." });
    return response.json({ company: publicCompany(result) });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/companies/mark-contacted", async (request, response, next) => {
  const ids = request.body?.ids;
  const lastContactDate = request.body?.lastContactDate;
  if (!Array.isArray(ids) || ids.length > 10000 || !ids.every(Number.isInteger) || typeof lastContactDate !== "string") {
    return response.status(400).json({ error: "A valid set of company IDs is required." });
  }

  try {
    await companies.updateMany(
      { ownerId: request.user.uid, id: { $in: ids } },
      { $set: { contacted: true, status: "contacted", lastContactDate } },
    );
    return response.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/companies/reset", async (request, response, next) => {
  const freshCompanies = normalizeCompanies(request.body?.companies);
  if (!freshCompanies) {
    return response.status(400).json({ error: "A valid company list is required." });
  }

  try {
    await companies.deleteMany({ ownerId: request.user.uid });
    await companies.insertMany(freshCompanies.map((company) => ({ ...company, ownerId: request.user.uid })));
    return response.json({ companies: freshCompanies });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "The server could not save your changes. Please try again." });
});

async function start() {
  await mongo.connect();
  await companies.createIndex({ ownerId: 1, id: 1 }, { unique: true });
  const port = Number(process.env.PORT || 3001);
  app.listen(port, () => console.log(`API listening on port ${port}`));
}

start().catch((error) => {
  console.error("Could not start the API:", error);
  process.exit(1);
});

process.on("SIGINT", () => mongo.close().finally(() => process.exit(0)));
