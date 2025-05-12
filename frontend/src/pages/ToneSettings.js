import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ToneSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toneSettings, setToneSettings] = useState({
    defaultTone: 'professional',
    customTones: []
  });
  const [newToneName, setNewToneName] = useState('');
  const [newToneDescription, setNewToneDescription] = useState('');
  const [newTonePrompt, setNewTonePrompt] = useState('');
  const [editingToneId, setEditingToneId] = useState(null);

  useEffect(() => {
    // Simulate fetching tone settings
    const fetchToneSettings = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Mock data
        setToneSettings({
          defaultTone: 'professional',
          customTones: [
            {
              id: 1,
              name: 'Professional',
              description: 'Formal and business-appropriate tone',
              prompt: 'Write in a professional, business-appropriate tone that is clear, concise, and formal without being stuffy.'
            },
            {
              id: 2,
              name: 'Casual',
              description: 'Relaxed and conversational tone',
              prompt: 'Write in a casual, conversational tone as if talking to a friend. Use contractions and simple language.'
            },
            {
              id: 3,
              name: 'Humorous',
              description: 'Light-hearted and funny tone',
              prompt: 'Write with humor and wit. Include jokes or playful language where appropriate while still conveying the message.'
            }
          ]
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tone settings:', error);
        setLoading(false);
      }
    };
    
    fetchToneSettings();
  }, []);

  const handleDefaultToneChange = (e) => {
    setToneSettings(prev => ({
      ...prev,
      defaultTone: e.target.value
    }));
  };

  const handleAddTone = () => {
    if (!newToneName.trim() || !newTonePrompt.trim()) {
      alert('Please provide both a name and prompt for the new tone.');
      return;
    }
    
    const newTone = {
      id: Date.now(), // Simple way to generate unique ID
      name: newToneName,
      description: newToneDescription,
      prompt: newTonePrompt
    };
    
    setToneSettings(prev => ({
      ...prev,
      customTones: [...prev.customTones, newTone]
    }));
    
    // Reset form
    setNewToneName('');
    setNewToneDescription('');
    setNewTonePrompt('');
  };

  const handleEditTone = (tone) => {
    setEditingToneId(tone.id);
    setNewToneName(tone.name);
    setNewToneDescription(tone.description);
    setNewTonePrompt(tone.prompt);
  };

  const handleUpdateTone = () => {
    if (!newToneName.trim() || !newTonePrompt.trim()) {
      alert('Please provide both a name and prompt for the tone.');
      return;
    }
    
    setToneSettings(prev => ({
      ...prev,
      customTones: prev.customTones.map(tone => 
        tone.id === editingToneId 
          ? { ...tone, name: newToneName, description: newToneDescription, prompt: newTonePrompt }
          : tone
      )
    }));
    
    // Reset form
    setEditingToneId(null);
    setNewToneName('');
    setNewToneDescription('');
    setNewTonePrompt('');
  };

  const handleDeleteTone = (id) => {
    if (window.confirm('Are you sure you want to delete this tone?')) {
      setToneSettings(prev => ({
        ...prev,
        customTones: prev.customTones.filter(tone => tone.id !== id)
      }));
    }
  };

  const handleCancelEdit = () => {
    setEditingToneId(null);
    setNewToneName('');
    setNewToneDescription('');
    setNewTonePrompt('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Tone settings saved successfully!');
    } catch (error) {
      console.error('Error saving tone settings:', error);
      alert('Failed to save tone settings. Please try again.');
    } finally {
      setSaving(false);
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
      <div className="flex items-center mb-6">
        <Link to="/settings" className="text-blue-500 hover:text-blue-700 mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">Tone Settings</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">Configure Content Tones</h2>
          <p className="text-sm text-gray-500 mt-1">
            Define the tone of voice used when generating content for your posts.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Default Tone Selection */}
          <div className="mb-8">
            <h3 className="text-md font-medium mb-4">Default Tone</h3>
            
            <div>
              <label htmlFor="defaultTone" className="block text-sm font-medium text-gray-700 mb-1">
                Select Default Tone
              </label>
              <select
                id="defaultTone"
                name="defaultTone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={toneSettings.defaultTone}
                onChange={handleDefaultToneChange}
              >
                {toneSettings.customTones.map(tone => (
                  <option key={tone.id} value={tone.name.toLowerCase()}>
                    {tone.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                This tone will be used by default when creating new posts.
              </p>
            </div>
          </div>
          
          {/* Custom Tones */}
          <div className="mb-8">
            <h3 className="text-md font-medium mb-4">Custom Tones</h3>
            
            <div className="space-y-4">
              {toneSettings.customTones.map(tone => (
                <div key={tone.id} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{tone.name}</h4>
                      <p className="text-sm text-gray-500">{tone.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditTone(tone)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteTone(tone.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h5 className="text-sm font-medium">Prompt:</h5>
                    <p className="text-sm text-gray-600 mt-1">{tone.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Add/Edit Tone Form */}
          <div className="mb-8 bg-gray-50 p-6 rounded-md">
            <h3 className="text-md font-medium mb-4">
              {editingToneId ? 'Edit Tone' : 'Add New Tone'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="toneName" className="block text-sm font-medium text-gray-700 mb-1">
                  Tone Name
                </label>
                <input
                  type="text"
                  id="toneName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newToneName}
                  onChange={(e) => setNewToneName(e.target.value)}
                  placeholder="e.g., Professional, Casual, Humorous"
                />
              </div>
              
              <div>
                <label htmlFor="toneDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  id="toneDescription"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newToneDescription}
                  onChange={(e) => setNewToneDescription(e.target.value)}
                  placeholder="Brief description of this tone"
                />
              </div>
              
              <div>
                <label htmlFor="tonePrompt" className="block text-sm font-medium text-gray-700 mb-1">
                  Tone Prompt
                </label>
                <textarea
                  id="tonePrompt"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTonePrompt}
                  onChange={(e) => setNewTonePrompt(e.target.value)}
                  placeholder="Instructions for the AI on how to write in this tone"
                ></textarea>
                <p className="mt-1 text-sm text-gray-500">
                  Provide clear instructions for how the AI should write content in this tone.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                {editingToneId && (
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                  onClick={editingToneId ? handleUpdateTone : handleAddTone}
                >
                  {editingToneId ? 'Update Tone' : 'Add Tone'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToneSettings;