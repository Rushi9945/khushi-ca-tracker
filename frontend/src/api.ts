const API_URL = 'http://localhost:8000';

export interface Chapter {
  id: number;
  subject_id: number;
  name: string;
  is_completed: boolean;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  group: string;
  chapters?: Chapter[];
}

export const fetchSubjects = async (): Promise<Subject[]> => {
  const response = await fetch(`${API_URL}/subjects/`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const fetchChapters = async (subjectId: number): Promise<Chapter[]> => {
  const response = await fetch(`${API_URL}/subjects/${subjectId}/chapters`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const logSession = async (chapterId: number, durationMinutes: number) => {
  const response = await fetch(`${API_URL}/chapters/${chapterId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ duration_minutes: durationMinutes })
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};
