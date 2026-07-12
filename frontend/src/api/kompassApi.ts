import axios from 'axios';
import { useLocation } from "react-router-dom";
import Todo from '../types/Todo';
import Page from '../types/Page';

const API_URL = "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const login = async (username: string, password: string): Promise<void> => {
  await api.post("/login", {
    username,
    password,
  });
};

export const logout = async (): Promise<void> => {
  await api.post("/logout");
};

export const getAllTodos = async (): Promise<Todo[]> => {
  const response = await api.get(`${API_URL}/todos`);
  return response.data;
};

export const createTodo = async (title: string): Promise<Todo> => {
  const response = await api.post(`${API_URL}/todos`, { title });
  return response.data;
};

export const updateTodo = async (id: number , updates: Todo): Promise<Todo> => {
  const response = await api.put(`${API_URL}/todos/${id}`, updates);
  return response.data;
};

export const deleteTodo = async (id: number): Promise<any> => {
  const response = await api.delete(`${API_URL}/todos/${id}`);
  return response.data;
}

export const getAllPages = async (): Promise<Page[]> => {
  const response = await api.get(`${API_URL}/pages`);
  return response.data;
};

export const me = async (): Promise<Page[]> => {
  const response = await api.get(`${API_URL}/me`);
  return response.data;
};

export const getPage = async (id: number): Promise<Page> => {
  const response = await api.get(`${API_URL}/pages/${id}`);
  return response.data;
};

export const createPage = async (title: string, content: string): Promise<Page> => {
  const response = await api.post(`${API_URL}/pages`, { title, content });
  return response.data;
};

export const updatePage = async (id: number , updates: Page): Promise<Page> => {
  const response = await api.put(`${API_URL}/pages/${id}`, updates);
  return response.data;
};

export const deletePage = async (id: number): Promise<any> => {
  const response = await api.delete(`${API_URL}/pages/${id}`);
  return response.data;
}

export const getPageByTitle = async (title: string): Promise<Page> => {
  const response = await api.get(`${API_URL}/pages/by-title/${encodeURIComponent(title)}`);
  return response.data;
};
