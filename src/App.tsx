/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, ChevronRight, ChevronLeft, Layout, CheckCircle2, Clock, AlertCircle } from "lucide-react";

type Priority = "low" | "medium" | "high";
type Status = "todo" | "in-progress" | "done";

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
}

const COLUMNS: { id: Status; label: string; icon: React.ReactNode }[] = [
  { id: "todo", label: "할 일", icon: <Clock className="w-4 h-4" /> },
  { id: "in-progress", label: "진행 중", icon: <AlertCircle className="w-4 h-4" /> },
  { id: "done", label: "완료", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddingTask, setIsAddingTask] = useState<Status | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" as Priority });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (status: Status) => {
    if (!newTask.title.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, status }),
      });
      const addedTask = await res.json();
      setTasks([...tasks, addedTask]);
      setNewTask({ title: "", description: "", priority: "medium" });
      setIsAddingTask(null);
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const updateTaskStatus = async (id: string, newStatus: Status) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updatedTask = await res.json();
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const moveTask = (id: string, currentStatus: Status, direction: "left" | "right") => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === currentStatus);
    const nextIndex = direction === "right" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
      updateTaskStatus(id, COLUMNS[nextIndex].id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1C1E] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Kanban Flow</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 font-medium">
              {tasks.length} Tasks Total
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95">
              Share Board
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col gap-4">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{column.icon}</span>
                  <h2 className="font-bold text-sm uppercase tracking-wider text-gray-500">
                    {column.label}
                  </h2>
                  <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {tasks.filter((t) => t.status === column.id).length}
                  </span>
                </div>
                <button 
                  onClick={() => setIsAddingTask(column.id)}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors text-gray-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task List */}
              <div className="flex flex-col gap-3 min-h-[500px]">
                <AnimatePresence mode="popLayout">
                  {tasks
                    .filter((t) => t.status === column.id)
                    .map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 leading-tight">{task.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{task.description}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                          <div className="flex gap-1">
                            {column.id !== "todo" && (
                              <button 
                                onClick={() => moveTask(task.id, task.status, "left")}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                            )}
                            {column.id !== "done" && (
                              <button 
                                onClick={() => moveTask(task.id, task.status, "right")}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">
                              {task.title.charAt(0)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add Task Inline Form */}
                {isAddingTask === column.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-4 rounded-xl border-2 border-indigo-500 shadow-lg"
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Task title..."
                      className="w-full text-sm font-semibold mb-2 focus:outline-none"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                    <textarea
                      placeholder="Description..."
                      className="w-full text-xs text-gray-500 mb-3 focus:outline-none resize-none"
                      rows={2}
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                    <div className="flex items-center justify-between">
                      <select 
                        className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-1 rounded border-none focus:ring-0"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsAddingTask(null)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => addTask(column.id)}
                          className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isAddingTask !== column.id && (
                  <button 
                    onClick={() => setIsAddingTask(column.id)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> New Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
