import React, { useState, useEffect } from 'react';

const ScheduledPosts = () => {
  const [loading, setLoading] = useState(true);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  useEffect(() => {
    // Simulate fetching scheduled posts
    const fetchScheduledPosts = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockPosts = [
          {
            id: 1,
            content: 'Excited to announce our new feature launch! Check out our website for more details.',
            scheduledDate: '2023-10-25T10:00:00',
            hasMedia: true,
            mediaCount: 1,
            status: 'scheduled'
          },
          {
            id: 2,
            content: 'Join us for our upcoming webinar on social media marketing strategies for 2023.',
            scheduledDate: '2023-10-20T14:30:00',
            hasMedia: false,
            mediaCount: 0,
            status: 'scheduled'
          },
          {
            id: 3,
            content: 'Happy Friday everyone! What are your weekend plans? Share in the comments below!',
            scheduledDate: '2023-10-27T16:00:00',
            hasMedia: true,
            mediaCount: 2,
            status: 'scheduled'
          },
          {
            id: 4,
            content: 'Monday motivation: "The only way to do great work is to love what you do." - Steve Jobs',
            scheduledDate: '2023-10-30T09:00:00',
            hasMedia: false,
            mediaCount: 0,
            status: 'scheduled'
          },
          {
            id: 5,
            content: 'Check out our latest blog post on industry trends for 2023.',
            scheduledDate: '2023-11-02T11:15:00',
            hasMedia: true,
            mediaCount: 1,
            status: 'scheduled'
          }
        ];
        
        setScheduledPosts(mockPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching scheduled posts:', error);
        setLoading(false);
      }
    };
    
    fetchScheduledPosts();
  }, []);

  const handleDeletePost = (id) => {
    if (window.confirm('Are you sure you want to delete this scheduled post?')) {
      setScheduledPosts(scheduledPosts.filter(post => post.id !== id));
    }
  };

  const handleEditPost = (id) => {
    // In a real app, this would navigate to the edit page or open a modal
    alert(`Edit post with ID: ${id}`);
  };

  const filteredPosts = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    switch (filter) {
      case 'today':
        return scheduledPosts.filter(post => {
          const postDate = new Date(post.scheduledDate);
          return postDate >= today && postDate < new Date(today.getTime() + 86400000);
        });
      case 'week':
        return scheduledPosts.filter(post => {
          const postDate = new Date(post.scheduledDate);
          return postDate >= today && postDate < nextWeek;
        });
      case 'month':
        return scheduledPosts.filter(post => {
          const postDate = new Date(post.scheduledDate);
          return postDate >= today && postDate < nextMonth;
        });
      default:
        return scheduledPosts;
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Scheduled Posts</h1>
        
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              filter === 'today' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              filter === 'week' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              filter === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('month')}
          >
            This Month
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {filteredPosts().length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No scheduled posts found for the selected filter.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPosts().map(post => (
                <div key={post.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <p className="mb-2">{post.content}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Scheduled for {formatDate(post.scheduledDate)}</span>
                      </div>
                      {post.hasMedia && (
                        <div className="mt-1 text-sm text-gray-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{post.mediaCount} {post.mediaCount === 1 ? 'media file' : 'media files'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditPost(post.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduledPosts;