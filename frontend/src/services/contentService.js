import api from './api';

export const contentService = {
  generateReply: async (requestData) => {
    try {
      const response = await api.post('/content/generate-reply', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to generate reply');
    }
  },

  generatePost: async (requestData) => {
    try {
      const response = await api.post('/content/generate-post', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to generate post');
    }
  },

  generateThread: async (requestData) => {
    try {
      const response = await api.post('/content/generate-thread', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to generate thread');
    }
  },

  editThread: async (requestData) => {
    try {
      const response = await api.post('/content/edit-thread', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to edit thread');
    }
  },

  analyzeTone: async (text) => {
    try {
      const response = await api.post('/content/analyze-tone', { text });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to analyze tone');
    }
  },

  matchTone: async (text, targetTone) => {
    try {
      const response = await api.post('/content/match-tone', { text, target_tone: targetTone });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to match tone');
    }
  },

  predictPerformance: async (requestData) => {
    try {
      const response = await api.post('/content/predict-performance', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to predict performance');
    }
  },
};