const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const PUBLIC_DIR = ROOT_DIR; // serves index.html, script.js, style.css, logo.jpg
const DATA_DIR = path.join(ROOT_DIR, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const RESOURCES = [
  {
    id: "res-1",
    title: "Understanding Anxiety",
    type: "videos",
    description: "Learn about anxiety symptoms, triggers, and coping mechanisms.",
    duration: "12 min",
  },
  {
    id: "res-2",
    title: "Sleep Hygiene Guide",
    type: "articles",
    description: "Tips for better sleep habits to improve mental health and academic performance.",
    duration: "7 min read",
  },
  {
    id: "res-3",
    title: "Breathing Exercises for Calm",
    type: "audio",
    description: "Quick breathing techniques to reduce stress and anxiety in the moment.",
    duration: "8 min",
  },
  {
    id: "res-4",
    title: "Building Resilience",
    type: "videos",
    description: "Develop mental strength and bounce back from challenges.",
    duration: "18 min",
  },
  {
    id: "res-5",
    title: "Mood Tracker",
    type: "tools",
    description: "Interactive tool to track your daily mood and identify patterns.",
    duration: "Interactive",
  },
  {
    id: "res-6",
    title: "Study-Life Balance Planner",
    type: "tools",
    description:
      "Plan your schedule to maintain healthy balance between studies and self-care.",
    duration: "Interactive",
  },
];

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    const initial = { users: [], appointments: [], chat: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeDb(db) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function notFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

function badRequest(res, message) {
  json(res, 400, { ok: false, error: message || "Bad request" });
}

function unauthorized(res, message) {
  json(res, 401, { ok: false, error: message || "Unauthorized" });
}

function methodNotAllowed(res) {
  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function safeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function serveStatic(req, res, url) {
  const pathname = decodeURIComponent(url.pathname);
  const rel = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(PUBLIC_DIR, rel);

  const resolved = path.resolve(filePath);
  const publicResolved = path.resolve(PUBLIC_DIR);
  if (!resolved.startsWith(publicResolved + path.sep) && resolved !== publicResolved) {
    return notFound(res);
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) return notFound(res);
    const data = await fs.readFile(resolved);
    res.writeHead(200, { "Content-Type": guessContentType(resolved) });
    res.end(data);
  } catch {
    return notFound(res);
  }
}

async function handleApi(req, res, url) {
  const pathname = url.pathname || "";

  if (pathname === "/api/health" && req.method === "GET") {
    return json(res, 200, { ok: true });
  }

  if (pathname === "/api/resources" && req.method === "GET") {
    const type = url.searchParams.get("type");
    const list = type && type !== "all" ? RESOURCES.filter((r) => r.type === type) : RESOURCES;
    return json(res, 200, { ok: true, resources: list });
  }

  if (pathname === "/api/auth/register" && req.method === "POST") {
    const body = await readJsonBody(req);
    if (body === undefined) return badRequest(res, "Invalid JSON");
    const username = (body?.username || "").trim();
    const password = (body?.password || "").trim();
    if (!username || !password) return badRequest(res, "Missing username or password");

    const db = await readDb();
    const existing = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existing) return badRequest(res, "Username already exists");

    const user = { id: safeId("user"), username, password, userType: "user", createdAt: new Date().toISOString() };
    db.users.push(user);
    await writeDb(db);

    return json(res, 200, { ok: true, user: { id: user.id, username: user.username, userType: user.userType } });
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    const body = await readJsonBody(req);
    if (body === undefined) return badRequest(res, "Invalid JSON");
    const userType = (body?.userType || "user").trim();
    const username = (body?.username || "").trim();
    const password = (body?.password || "").trim();
    if (!username || !password) return badRequest(res, "Missing username or password");

    if (userType === "admin") {
      if (username === "admin" && password === "admin123") {
        return json(res, 200, { ok: true, user: { username: "Admin", userType: "admin" } });
      }
      return unauthorized(res, "Invalid admin credentials");
    }

    const db = await readDb();
    const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) return unauthorized(res, "Invalid credentials");
    return json(res, 200, { ok: true, user: { id: user.id, username: user.username, userType: user.userType } });
  }

  if (pathname === "/api/appointments" && req.method === "GET") {
    const username = (url.searchParams.get("username") || "").trim();
    if (!username) return badRequest(res, "Missing username");

    const db = await readDb();
    const list = db.appointments.filter((a) => a.username.toLowerCase() === username.toLowerCase());
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return json(res, 200, { ok: true, appointments: list });
  }

  if (pathname === "/api/appointments" && req.method === "POST") {
    const body = await readJsonBody(req);
    if (body === undefined) return badRequest(res, "Invalid JSON");
    const username = (body?.username || "").trim();
    const counselor = (body?.counselor || "").trim();
    const date = (body?.date || "").trim(); // YYYY-MM-DD
    const time = (body?.time || "").trim(); // HH:MM
    const notes = (body?.notes || "").trim();
    if (!username || !counselor || !date || !time) return badRequest(res, "Missing required fields");

    const db = await readDb();
    const appt = {
      id: safeId("appt"),
      username,
      counselor,
      date,
      time,
      notes,
      status: "requested",
      createdAt: new Date().toISOString(),
    };
    db.appointments.push(appt);
    await writeDb(db);
    return json(res, 200, { ok: true, appointment: appt });
  }

  if (pathname.startsWith("/api/appointments/") && req.method === "DELETE") {
    const id = pathname.split("/").pop();
    const username = (url.searchParams.get("username") || "").trim();
    if (!id) return badRequest(res, "Missing appointment id");
    if (!username) return badRequest(res, "Missing username");

    const db = await readDb();
    const before = db.appointments.length;
    db.appointments = db.appointments.filter(
      (a) => !(a.id === id && a.username.toLowerCase() === username.toLowerCase())
    );
    if (db.appointments.length === before) return badRequest(res, "Appointment not found");
    await writeDb(db);
    return json(res, 200, { ok: true });
  }

  if (pathname === "/api/chat" && req.method === "POST") {
    const body = await readJsonBody(req);
    if (body === undefined) return badRequest(res, "Invalid JSON");
    const username = (body?.username || "").trim();
    const message = (body?.message || "").trim();
    if (!message) return badRequest(res, "Missing message");

    const db = await readDb();
    db.chat.push({ id: safeId("chat"), username: username || "anonymous", message, createdAt: new Date().toISOString() });
    await writeDb(db);
    return json(res, 200, { ok: true });
  }

  return notFound(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`Swasthya AI running at http://localhost:${PORT}`);
});

