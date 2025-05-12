import React, { useState } from 'react';
import { contentService } from '../services/contentService';
import { twitterService } from '../services/twitterService';
import { useAuth } from '../hooks/useAuth';

const Compose = () => {
  const [postContent, setPostContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tone, setTone] = useState('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { currentUser } = useAuth();

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles([...mediaFiles, ...files]);
  };

  const removeMedia = (index) => {
    const updatedFiles = [...mediaFiles];
    updatedFiles.splice(index, 1);
    setMediaFiles(updatedFiles);
  };

  const generateAIContent = async () => {
    if (!aiDescription.trim()) {
      setError('Please enter a description for the AI to generate content');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      // Create tone settings object
      const toneSettings = {
        tone_name: tone,
        tone_strength: 0.8,
        custom_instructions: ""
      };
      
      // Call the content service to generate a post
      const response = await contentService.generatePost({
        description: aiDescription,
        tone: toneSettings,
        max_length: 280,
        is_preview: false
      });
      
      // Set the suggestions
      if (response && response.variants && response.variants.length > 0) {
        setAiSuggestions(response.variants.map(variant => variant.text));
      } else {
        setError('No suggestions were generated. Please try again with a different description.');
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      setError('Failed to generate AI content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setPostContent(suggestion);
    setAiSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!postContent.trim()) {
      setError('Please enter some content for your post');
      return;
    }
    
    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      setError('Please select both date and time for scheduled post');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Prepare media paths (in a real app, you'd upload these files first)
      const mediaPaths = mediaFiles.map(file => URL.createObjectURL(file));
      
      // Prepare schedule time if needed
      let scheduleTime = null;
      if (isScheduled) {
        const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        scheduleTime = dateTime.toISOString();
      }
      
      // Get credentials from user settings or use empty credentials
      // In a real app, you'd have proper authentication
      const credentials = currentUser?.accounts && currentUser.accounts.length > 0 
        ? { username: currentUser.accounts[0].username } 
        : {};
      
      // Call the Twitter service to post the tweet
      const result = await twitterService.postTweet({
        content: postContent,
        credentials: credentials,
        media_paths: mediaPaths,
        schedule_time: scheduleTime
      });
      
      if (result.success) {
        // Reset form
        setPostContent('');
        setMediaFiles([]);
        setIsScheduled(false);
        setScheduledDate('');
        setScheduledTime('');
        setAiDescription('');
        setAiSuggestions([]);
        
        // Show success message
        setSuccessMessage(isScheduled ? 'Post scheduled successfully!' : 'Post published successfully!');
      } else {
        setError(result.error || 'Failed to publish post. Please try again.');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      setError('Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Compose Post</h1>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Content Generation */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">AI-Assisted Content</h2>
        
        <div className="mb-4">
          <label htmlFor="ai-description" className="block text-sm font-medium text-gray-700 mb-2">
            Describe what you want to tweet about
          </label>
          <textarea
            id="ai-description"
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="E.g., 'Announce our new product launch with excitement'"
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-twitter-blue hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium flex items-center"
            onClick={generateAIContent}
            disabled={isGenerating || !aiDescription.trim()}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate with AI'
            )}
          </button>
        </div>
        
        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">AI Suggestions</h3>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <p>{suggestion}</p>
                  <div className="mt-2 flex justify-end">
                    <button 
                      type="button"
                      className="text-xs text-twitter-blue hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSuggestion(suggestion);
                      }}
                    >
                      Use this suggestion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Post Content
          </label>
          <textarea
            id="content"
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What's happening?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            maxLength={280}
          ></textarea>
          <div className="text-right text-sm text-gray-500 mt-1">
            {postContent.length}/280
          </div>
        </div>
        
        {/* Media Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media
          </label>
          <div className="flex items-center">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md">
              <span>Add Media</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
              />
            </label>
          </div>
          
          {mediaFiles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {mediaFiles.map((file, index) => (
                <div key={index} className="relative">
                  <div className="h-20 w-20 border rounded-md flex items-center justify-center bg-gray-100">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="h-full w-full object-cover rounded-md"
                      />
                    ) : (
                      <span className="text-xs text-center p-1">Video: {file.name}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    onClick={() => removeMedia(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Tone Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="casual">Casual</option>
            <option value="professional">Professional</option>
            <option value="witty">Witty</option>
            <option value="sarcastic">Sarcastic</option>
            <option value="motivational">Motivational</option>
            <option value="friendly founder">Friendly Founder</option>
            <option value="witty developer">Witty Developer</option>
          </select>
        </div>
        
        {/* Schedule Toggle */}
        <div className="mb-6">
          <div className="flex items-center">
            <input
              id="schedule"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={isScheduled}
              onChange={() => setIsScheduled(!isScheduled)}
            />
            <label htmlFor="schedule" className="ml-2 block text-sm text-gray-700">
              Schedule for later
            </label>
          </div>
          
          {isScheduled && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-twitter-blue hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : isScheduled ? 'Schedule Post' : 'Post Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Compose;
