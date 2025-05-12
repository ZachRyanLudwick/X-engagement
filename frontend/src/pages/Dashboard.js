import React, { useState, useEffect } from 'react';
import { twitterService } from '../services/twitterService';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Dashboard = () => {
  const [recentPosts, setRecentPosts] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    engagement: 0,
    scheduledPosts: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [twitterUsername, setTwitterUsername] = useState('');
  const [twitterAccounts, setTwitterAccounts] = useState([]);
  const [error, setError] = useState(null);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);

  useEffect(() => {
    // Fetch Twitter accounts and dashboard data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, try to get Twitter accounts
        try {
          const accounts = await authService.getTwitterAccounts();
          if (accounts && accounts.length > 0) {
            setTwitterAccounts(accounts);
            
            // Find default account or use the first one
            const defaultAccount = accounts.find(acc => acc.is_default) || accounts[0];
            setTwitterUsername(defaultAccount.username);
            
            // Now fetch timeline data for this account
            await fetchTimelineData(defaultAccount.username);
            setShowAccountPrompt(false);
            return;
          } else {
            // No accounts found from API
            setShowAccountPrompt(true);
          }
        } catch (error) {
          console.error('Error fetching Twitter accounts:', error);
          
          // Check if we have accounts in the current user object as fallback
          if (currentUser?.accounts && currentUser.accounts.length > 0) {
            const username = currentUser.accounts[0].username;
            setTwitterUsername(username);
            await fetchTimelineData(username);
            setShowAccountPrompt(false);
            return;
          }
          
          // No accounts found, show prompt
          setShowAccountPrompt(true);
        }
        
        // If we get here, we don't have any accounts, use mock data
        setRecentPosts([
          { id: 1, content: 'Just launched our new product!', date: '2023-10-15', engagement: 245 },
          { id: 2, content: 'Thanks for all the support on our journey.', date: '2023-10-12', engagement: 189 },
          { id: 3, content: 'Exciting news coming next week! Stay tuned.', date: '2023-10-10', engagement: 321 }
        ]);
        
        setStats({
          totalPosts: 42,
          engagement: 1876,
          scheduledPosts: 5
        });
        
      } catch (error) {
        console.error('Error in dashboard data flow:', error);
        setError('Failed to load dashboard data. Please try again later.');
        
        // Fallback to mock data
        setRecentPosts([
          { id: 1, content: 'Just launched our new product!', date: '2023-10-15', engagement: 245 },
          { id: 2, content: 'Thanks for all the support on our journey.', date: '2023-10-12', engagement: 189 },
          { id: 3, content: 'Exciting news coming next week! Stay tuned.', date: '2023-10-10', engagement: 321 }
        ]);
        
        setStats({
          totalPosts: 42,
          engagement: 1876,
          scheduledPosts: 5
        });
      } finally {
        setLoading(false);
      }
    };
    
    const fetchTimelineData = async (username) => {
      try {
        // Fetch recent tweets from the timeline
        const tweets = await twitterService.fetchTimeline(username, 5);
        
        // Transform tweets to the format we need
        const formattedTweets = tweets.map(tweet => ({
          id: tweet.id,
          content: tweet.text,
          date: new Date(tweet.created_at).toISOString().split('T')[0],
          engagement: tweet.likes_count + tweet.retweets_count + tweet.replies_count
        }));
        
        setRecentPosts(formattedTweets);
        
        // Get scheduled posts
        const scheduledData = await twitterService.getScheduledPosts();
        const scheduledCount = scheduledData.tweets.length + scheduledData.threads.length;
        
        // Calculate total engagement from tweets
        const totalEngagement = tweets.reduce((sum, tweet) => 
          sum + tweet.likes_count + tweet.retweets_count + tweet.replies_count, 0);
        
        setStats({
          totalPosts: tweets.length,
          engagement: totalEngagement,
          scheduledPosts: scheduledCount
        });
      } catch (error) {
        console.error('Error fetching timeline data:', error);
        throw error;
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {twitterUsername && (
          <div className="text-sm text-gray-600">
            Viewing data for: <span className="font-semibold text-twitter-blue">@{twitterUsername}</span>
          </div>
        )}
      </div>
      
      {/* Account Prompt */}
      {showAccountPrompt && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                No Twitter account linked. Please <Link to="/settings" className="font-medium underline">link your Twitter account</Link> to see your real data.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/compose" className="bg-twitter-blue text-white rounded-lg shadow p-4 hover:bg-blue-600 transition-colors">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            <span>New Tweet</span>
          </div>
        </Link>
        <Link to="/compose/thread" className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-twitter-blue" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            <span>Create Thread</span>
          </div>
        </Link>
        <Link to="/analytics" className="bg-white rounded-lg shadow p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-twitter-blue" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span>View Analytics</span>
          </div>
        </Link>
      </div>
      
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
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Posts</h3>
          <p className="text-3xl font-bold">{stats.totalPosts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Engagement</h3>
          <p className="text-3xl font-bold">{stats.engagement}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Scheduled Posts</h3>
          <p className="text-3xl font-bold">{stats.scheduledPosts}</p>
          {stats.scheduledPosts > 0 && (
            <Link to="/scheduled" className="text-sm text-twitter-blue hover:underline mt-2 inline-block">
              View scheduled
            </Link>
          )}
        </div>
      </div>
      
      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Recent Posts</h2>
          <Link to="/analytics" className="text-sm text-twitter-blue hover:underline">
            View all analytics
          </Link>
        </div>
        {recentPosts.length > 0 ? (
          <div className="divide-y">
            {recentPosts.map(post => (
              <div key={post.id} className="p-6">
                <p className="mb-2">{post.content}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Posted on {post.date}</span>
                  <span>{post.engagement} engagements</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No recent posts found. Start tweeting to see your posts here!
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;