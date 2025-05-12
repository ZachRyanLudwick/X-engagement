import api from './api';

export const authService = {
  login: async (credentials) => {
    try {
      // Convert to form data for OAuth2 compatibility
      const formData = new FormData();
      formData.append('username', credentials.username || credentials.email);
      formData.append('password', credentials.password);
      
      const response = await api.post('/user/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/user/auth/register', {
        email: userData.email,
        username: userData.username,
        password: userData.password,
        name: userData.name
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/user/auth/logout', { token });
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(error.response?.data?.detail || 'Logout failed');
    }
  },

  getUserProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get user profile');
    }
  },

  updateUserSettings: async (settings) => {
    try {
      const response = await api.post('/user/settings', settings);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update user settings');
    }
  },

  createTonePreset: async (preset) => {
    try {
      const response = await api.post('/user/tone-presets', preset);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create tone preset');
    }
  },

  deleteTonePreset: async (presetName) => {
    try {
      const response = await api.delete(`/user/tone-presets/${presetName}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete tone preset');
    }
  },

  addTwitterAccount: async (account) => {
    try {
      const response = await api.post('/user/accounts', account);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to add Twitter account');
    }
  },

  removeTwitterAccount: async (username) => {
    try {
      const response = await api.delete(`/user/accounts/${username}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to remove Twitter account');
    }
  },
};