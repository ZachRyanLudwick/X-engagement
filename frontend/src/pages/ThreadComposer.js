import React, { useState } from 'react';
import { contentService } from '../services/contentService';
import { twitterService } from '../services/twitterService';
import { useAuth } from '../hooks/useAuth';

const ThreadComposer = () => {
  const [threadPosts, setThreadPosts] = useState([
    { id: 1, content: '', mediaFiles: [] }
  ]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tone, setTone] = useState('casual');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [numTweets, setNumTweets] = useState(3);
  const { currentUser } = useAuth();

  const handlePostContentChange = (id, content) => {
    setThreadPosts(threadPosts.map(post => 
      post.id === id ? { ...post, content } : post
    ));
  };

  const handleMediaUpload = (id, e) => {
    const files = Array.from(e.target.files);
    setThreadPosts(threadPosts.map(post => 
      post.id === id ? { ...post, mediaFiles: [...post.mediaFiles, ...files] } : post
    ));
  };

  const removeMedia = (postId, index) => {
    setThreadPosts(threadPosts.map(post => {
      if (post.id === postId) {
        const updatedFiles = [...post.mediaFiles];
        updatedFiles.splice(index, 1);
        return { ...post, mediaFiles: updatedFiles };
      }
      return post;
    }));
  };

  const addPost = () => {
    const newId = Math.max(...threadPosts.map(post => post.id)) + 1;
    setThreadPosts([...threadPosts, { id: newId, content: '', mediaFiles: [] }]);
  };

  const removePost = (id) => {
    if (threadPosts.length <= 1) {
      setError('Thread must have at least one post');
      return;
    }
    setThreadPosts(threadPosts.filter(post => post.id !== id));
  };

  const movePostUp = (id) => {
    const index = threadPosts.findIndex(post => post.id === id);
    if (index <= 0) return;
    
    const newThreadPosts = [...threadPosts];
    const temp = newThreadPosts[index];
    newThreadPosts[index] = newThreadPosts[index - 1];
    newThreadPosts[index - 1] = temp;
    
    setThreadPosts(newThreadPosts);
  };

  const movePostDown = (id) => {
    const index = threadPosts.findIndex(post => post.id === id);
    if (index >= threadPosts.length - 1) return;
    
    const newThreadPosts = [...threadPosts];
    const temp = newThreadPosts[index];
    newThreadPosts[index] = newThreadPosts[index + 1];
    newThreadPosts[index + 1] = temp;
    
    setThreadPosts(newThreadPosts);
  };

  const generateAIThread = async () => {
    if (!aiTopic.trim()) {
      setError('Please enter a topic for the AI to generate a thread');
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
      
      // Parse keywords
      const keywords = aiKeywords.trim() ? aiKeywords.split(',').map(k => k.trim()) : [];
      
      // Call the content service to generate a thread
      const response = await contentService.generateThread({
        main_topic: aiTopic,
        num_tweets: numTweets,
        tone: toneSettings,
        keywords: keywords,
        max_length_per_tweet: 280
      });
      
      // Set the thread posts
      if (response && response.tweets && response.tweets.length > 0) {
        const generatedPosts = response.tweets.map((tweet, index) => ({
          id: index + 1,
          content: tweet.text,
          mediaFiles: []
        }));
        setThreadPosts(generatedPosts);
        setSuccessMessage('Thread generated successfully! You can edit it before posting.');
      } else {
        setError('No thread was generated. Please try again with a different topic.');
      }
    } catch (error) {
      console.error('Error generating AI thread:', error);
      setError('Failed to generate AI thread. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all posts have content
    const emptyPosts = threadPosts.filter(post => !post.content.trim());
    if (emptyPosts.length > 0) {
      setError(`Please enter content for all posts in the thread (${emptyPosts.length} empty)`);
      return;
    }
    
    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      setError('Please select both date and time for scheduled thread');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Prepare media paths (in a real app, you'd upload these files first)
      const mediaPaths = threadPosts.flatMap(post => 
        post.mediaFiles.map(file => URL.createObjectURL(file))
      );
      
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
      
      // Prepare tweets content
      const tweets = threadPosts.map(post => post.content);
      
      // Call the Twitter service to post the thread
      const result = await twitterService.postThread({
        tweets: tweets,
        credentials: credentials,
        media_paths: mediaPaths,
        schedule_time: scheduleTime
      });
      
      if (result.success) {
        // Reset form
        setThreadPosts([{ id: 1, content: '', mediaFiles: [] }]);
        setIsScheduled(false);
        setScheduledDate('');
        setScheduledTime('');
        setAiTopic('');
        setAiKeywords('');
        
        // Show success message
        setSuccessMessage(isScheduled ? 'Thread scheduled successfully!' : 'Thread published successfully!');
      } else {
        setError(result.error || 'Failed to publish thread. Please try again.');
      }
    } catch (error) {
      console.error('Error publishing thread:', error);
      setError('Failed to publish thread. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Compose Thread</h1>
      
      <form onSubmit={handleSubmit}>
        {threadPosts.map((post, index) => (
          <div key={post.id} className="bg-white rounded-lg shadow p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Post {index + 1}</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => movePostUp(post.id)}
                  disabled={index === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => movePostDown(post.id)}
                  disabled={index === threadPosts.length - 1}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removePost(post.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <textarea
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`What's on your mind for post ${index + 1}?`}
                value={post.content}
                onChange={(e) => handlePostContentChange(post.id, e.target.value)}
                maxLength={280}
              ></textarea>
              <div className="text-right text-sm text-gray-500 mt-1">
                {post.content.length}/280
              </div>
            </div>
            
            {/* Media Upload */}
            <div className="mb-4">
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
                    onChange={(e) => handleMediaUpload(post.id, e)}
                  />
                </label>
              </div>
              
              {post.mediaFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.mediaFiles.map((file, fileIndex) => (
                    <div key={fileIndex} className="relative">
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
                        onClick={() => removeMedia(post.id, fileIndex)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div className="mb-6">
          <button
            type="button"
            className="flex items-center text-blue-500 hover:text-blue-700"
            onClick={addPost}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Another Post
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
              <option value="friendly">Friendly</option>
              <option value="humorous">Humorous</option>
              <option value="formal">Formal</option>
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
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : isScheduled ? 'Schedule Thread' : 'Post Thread'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ThreadComposer;