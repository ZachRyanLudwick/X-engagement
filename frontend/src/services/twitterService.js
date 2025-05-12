import api from './api';

export const twitterService = {
  postTweet: async (requestData) => {
    try {
      const response = await api.post('/twitter/post', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to post tweet');
    }
  },

  postThread: async (requestData) => {
    try {
      const response = await api.post('/twitter/post-thread', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to post thread');
    }
  },

  fetchTimeline: async (username, count = 20) => {
    try {
      const response = await api.get(`/twitter/fetch-timeline?username=${username}&count=${count}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch timeline');
    }
  },

  fetchTweet: async (tweetId) => {
    try {
      const response = await api.get(`/twitter/fetch-tweet/${tweetId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch tweet');
    }
  },

  replyToTweet: async (tweetId, requestData) => {
    try {
      const response = await api.post(`/twitter/reply/${tweetId}`, requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to reply to tweet');
    }
  },

  getTweetAnalytics: async (tweetId) => {
    try {
      const response = await api.get(`/twitter/analytics/${tweetId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get tweet analytics');
    }
  },

  getScheduledPosts: async () => {
    try {
      const response = await api.get('/twitter/scheduled');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get scheduled posts');
    }
  },

  deleteScheduledItem: async (itemId) => {
    try {
      const response = await api.delete(`/twitter/scheduled/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to delete scheduled item');
    }
  },

  generateMeme: async (requestData) => {
    try {
      const response = await api.post('/twitter/generate-meme', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to generate meme');
    }
  },

  repurposeContent: async (requestData) => {
    try {
      const response = await api.post('/twitter/repurpose-content', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to repurpose content');
    }
  },

  getMemeTemplates: async () => {
    try {
      const response = await api.get('/twitter/meme-templates');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get meme templates');
    }
  },

  bulkReply: async (tweets, replyTemplate, tone, credentials) => {
    try {
      const response = await api.post('/twitter/bulk-reply', { tweets, reply_template: replyTemplate, tone, credentials });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to queue bulk replies');
    }
  },
};