import { useState, useEffect } from 'react';

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string | null;
  cycle: 'Initial' | 'R1' | 'R2' | 'R3';
  status: 'TODAY' | 'SCHEDULED' | 'PENDING' | 'COMPLETED';
  createdAt: number;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('ascend_tasks') || '[]');
      setTasks(stored);
    } catch {
      setTasks([]);
    }
  };

  useEffect(() => {
    loadTasks();
    window.addEventListener('tasksUpdated', loadTasks);
    return () => window.removeEventListener('tasksUpdated', loadTasks);
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    localStorage.setItem('ascend_tasks', JSON.stringify(newTasks));
    setTasks(newTasks);
    window.dispatchEvent(new Event('tasksUpdated'));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    saveTasks([...tasks, newTask]);
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, status } : t);
    saveTasks(newTasks);
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  };

  return { tasks, addTask, updateTaskStatus, deleteTask };
};
