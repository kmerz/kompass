import axios from 'axios';
import Todo from '../types/Todo';

const API_URL = "http://localhost:3001";

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
