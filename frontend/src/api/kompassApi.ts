import axios from 'axios';
import Todo from '../types/Todo';
import Page from '../types/Page';

const API_URL = "http://192.168.6.175:3001/api";

export const getAllTodos = async (): Promise<Todo[]> => {
  const response = await axios.get(`${API_URL}/todos`);
  return response.data;
};

export const createTodo = async (title: string): Promise<Todo> => {
  const response = await axios.post(`${API_URL}/todos`, { title });
  return response.data;
};

export const updateTodo = async (id: number , updates: Todo): Promise<Todo> => {
  const response = await axios.put(`${API_URL}/todos/${id}`, updates);
  return response.data;
};

export const deleteTodo = async (id: number): Promise<any> => {
  const response = await axios.delete(`${API_URL}/todos/${id}`);
  return response.data;
}

export const getAllPages = async (): Promise<Page[]> => {
  const response = await axios.get(`${API_URL}/pages`);
  return response.data;
};

export const getPage = async (id: number): Promise<Page[]> => {
  const response = await axios.get(`${API_URL}/pages/${id}`);
  return response.data;
};

export const createPage = async (title: string, content): Promise<Page> => {
  const response = await axios.post(`${API_URL}/pages`, { title, content });
  return response.data;
};

export const updatePage = async (id: number , updates: Page): Promise<Page> => {
  const response = await axios.put(`${API_URL}/pages/${id}`, updates);
  return response.data;
};

export const deletePage = async (id: number): Promise<any> => {
  const response = await axios.delete(`${API_URL}/pages/${id}`);
  return response.data;
}

export const getPageByTitle = async (title: string): Promise<Page> => {
  const response = await axios.get(`${API_URL}/pages/by-title/${encodeURIComponent(title)}`);
  return response.data;
};
