import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for tasks (for demo purposes)
  let tasks = [
    { id: "1", title: "프로젝트 기획", description: "칸반 보드 요구사항 정의 및 설계", status: "todo", priority: "high" },
    { id: "2", title: "UI 디자인", description: "Tailwind CSS를 이용한 현대적인 디자인 적용", status: "in-progress", priority: "medium" },
    { id: "3", title: "기본 환경 설정", description: "Vite, React, Express 환경 구성", status: "done", priority: "low" },
  ];

  // API Routes
  app.get("/api/tasks", (req, res) => {
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const newTask = { ...req.body, id: Date.now().toString() };
    tasks.push(newTask);
    res.status(201).json(newTask);
  });

  app.put("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...req.body } : t));
    res.json(tasks.find((t) => t.id === id));
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    tasks = tasks.filter((t) => t.id !== id);
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
