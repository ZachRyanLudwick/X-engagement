import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TwitterAuthModal from '../components/TwitterAuthModal';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTwitterModal, setShowTwitterModal] = useState(false);
  const [twitterAccounts, setTwitterAccounts] = useState([]);
  const [settings, setSettings] = useState({
    accountName: '',
    email: '',
    notifications: {
      email: true,
      push: true,
      scheduledPosts: true,
      mentions: true
    },
    apiKey: '',
    darkMode: false,
    autoPost: false
  });

  useEffect(() => {
    // Fetch settings and Twitter accounts
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Mock data for settings
        setSettings({
          accountName: 'Demo User',
          email: 'demo@example.com',
          notifications: {
            email: true,
            push: true,
            scheduledPosts: true,
            mentions: false
          },
          apiKey: 'sk-1234567890abcdefghijklmnopqrstuvwxyz',
          darkMode: false,
          autoPost: false
        });
        
        // Try to fetch Twitter accounts
        try {
          const accounts = await authService.getTwitterAccounts();
          if (accounts && accounts.length > 0) {
            setTwitterAccounts(accounts);
          } else {
            // Use mock data if API call returns empty
            setTwitterAccounts([
              {
                username: 'twitteruser1',
                display_name: 'Twitter User',
                profile_image_url: 'https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_normal.jpg',
                is_default: true,
                is_active: true
              }
            ]);
          }
        } catch (error) {
          console.error('Error fetching Twitter accounts:', error);
          // Use mock data if API call fails
          setTwitterAccounts([
            {
              username: 'twitteruser1',
              display_name: 'Twitter User',
              profile_image_url: 'https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_normal.jpg',
              is_default: true,
              is_active: true
            }
          ]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked
      }
    }));
  };

  const handleToggleChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTwitterSuccess = async (response) => {
    try {
      // Try to refresh Twitter accounts list from API
      try {
        const accounts = await authService.getTwitterAccounts();
        if (accounts && accounts.length > 0) {
          setTwitterAccounts(accounts);
          return;
        }
      } catch (error) {
        console.error('Error refreshing Twitter accounts:', error);
      }
      
      // If API call fails or returns empty, use the response data to create a mock account
      if (response && response.username) {
        const newAccount = {
          username: response.username,
          display_name: response.display_name || response.username,
          profile_image_url: response.profile_image_url || 'https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_normal.jpg',
          is_default: twitterAccounts.length === 0, // Make it default if it's the first account
          is_active: true
        };
        
        setTwitterAccounts(prev => [...prev, newAccount]);
      }
    } catch (error) {
      console.error('Error handling Twitter success:', error);
    }
  };

  const handleRemoveTwitterAccount = async (username) => {
    if (!window.confirm(`Are you sure you want to remove the Twitter account @${username}?`)) {
      return;
    }
    
    try {
      await authService.removeTwitterAccount(username);
      toast.success(`Twitter account @${username} removed successfully`);
      
      // Update the accounts list
      setTwitterAccounts(prev => prev.filter(account => account.username !== username));
    } catch (error) {
      console.error('Error removing Twitter account:', error);
      toast.error('Failed to remove Twitter account. Please try again.');
    }
  };

  const handleSetDefaultAccount = async (username) => {
    try {
      // In a real implementation, call the API to set the default account
      // await authService.setDefaultTwitterAccount(username);
      
      // Update the local state
      setTwitterAccounts(prev => 
        prev.map(account => ({
          ...account,
          is_default: account.username === username
        }))
      );
      
      toast.success(`@${username} set as default account`);
    } catch (error) {
      console.error('Error setting default account:', error);
      toast.error('Failed to set default account. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">X (Twitter) Accounts</h2>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Link your X (Twitter) account to enable analytics, posting, and automated replies.
            </p>
          </div>
          
          {twitterAccounts.length > 0 ? (
            <div className="space-y-4">
              {twitterAccounts.map((account) => (
                <div key={account.username} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    {account.profile_image_url && (
                      <img 
                        src={account.profile_image_url} 
                        alt={account.username} 
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <div className="font-medium">{account.display_name}</div>
                      <div className="text-sm text-gray-500">@{account.username}</div>
                    </div>
                    {account.is_default && (
                      <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!account.is_default && (
                      <button
                        onClick={() => handleSetDefaultAccount(account.username)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm rounded"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveTwitterAccount(account.username)}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg bg-gray-50">
              <p className="text-gray-500 mb-4">No X (Twitter) accounts linked</p>
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => setShowTwitterModal(true)}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
              Link X (Twitter) Account
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Account Settings</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Account Information */}
          <div className="mb-8">
            <h3 className="text-md font-medium mb-4">Account Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.accountName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          {/* API Settings */}
          <div className="mb-8">
            <h3 className="text-md font-medium mb-4">API Settings</h3>
            
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <div className="flex">
                <input
                  type="password"
                  id="apiKey"
                  name="apiKey"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.apiKey}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="bg-gray-100 px-4 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                  onClick={() => alert('Regenerate API Key functionality would go here')}
                >
                  Regenerate
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Your API key is used to authenticate requests to the API.
              </p>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="mb-8">
            <h3 className="text-md font-medium mb-4">Notification Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="email-notifications"
                  name="email"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={settings.notifications.email}
                  onChange={handleNotificationChange}
                />
                <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-700">
                  Email Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="push-notifications"
                  name="push"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={settings.notifications.push}
                  onChange={handleNotificationChange}
                />
                <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-700">
                  Push Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="scheduled-notifications"
                  name="scheduledPosts"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={settings.notifications.scheduledPosts}
                  onChange={handleNotificationChange}
                />
                <label htmlFor="scheduled-notifications" className="ml-2 block text-sm text-gray-700">
                  Scheduled Post Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="mentions-notifications"
                  name="mentions"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={settings.notifications.mentions}
                  onChange={handleNotificationChange}
                />
                <label htmlFor="mentions-notifications" className="ml-2 block text-sm text-gray-700">
                  Mentions Notifications
                </label>
              </div>
            </div>
          </div>
          
          {/* App Settings */}
          <div className="mb-8">
            <h3 className="text-md font-medium mb-4">App Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="dark-mode" className="block text-sm text-gray-700">
                  Dark Mode
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="dark-mode"
                    name="darkMode"
                    className="sr-only"
                    checked={settings.darkMode}
                    onChange={handleToggleChange}
                  />
                  <div className={`block w-10 h-6 rounded-full ${settings.darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.darkMode ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="auto-post" className="block text-sm text-gray-700">
                  Auto Post
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="auto-post"
                    name="autoPost"
                    className="sr-only"
                    checked={settings.autoPost}
                    onChange={handleToggleChange}
                  />
                  <div className={`block w-10 h-6 rounded-full ${settings.autoPost ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.autoPost ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tone Settings Link */}
          <div className="mb-8">
            <h3 className="text-md font-medium mb-4">Content Settings</h3>
            
            <Link 
              to="/settings/tone" 
              className="text-blue-500 hover:text-blue-700 flex items-center"
            >
              <span>Tone Settings</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Twitter Auth Modal */}
      <TwitterAuthModal 
        isOpen={showTwitterModal}
        onClose={() => setShowTwitterModal(false)}
        onSuccess={handleTwitterSuccess}
      />
    </div>
  );
};

export default Settings;