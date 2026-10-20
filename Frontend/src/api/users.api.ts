
import { http } from './http';

export const getAllUsers = async () => {
  const response = await http.get('/users/all-users');
  return response.data;
};

export const getUserProfile = async () => {
  const response = await http.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (payload: Record<string, unknown>) => {
  const response = await http.patch('/users/update-profile', payload);
  return response.data;
};

export const deleteUserProfile = async () => {
  const response = await http.delete('/users/delete-profile');
  return response.data;
};
