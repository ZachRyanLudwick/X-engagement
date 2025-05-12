import React, { useState, useEffect } from 'react';
import { twitterService } from '../services/twitterService';
import { useAuth } from '../hooks/useAuth';

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    impressions: [],
    engagement: [],
    followers: [],
    topPosts: []
  });
  const [twitterUsername, setTwitterUsername] = useState('');
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get the Twitter username from user settings or use a default
        const username = currentUser?.settings?.twitter_username || 
                        (currentUser?.accounts && currentUser.accounts.length > 0 ? 
                          currentUser.accounts[0].username : 'twitter');
        
        setTwitterUsername(username);
        
        // Fetch timeline to get tweets
        const tweets = await twitterService.fetchTimeline(username, 20);
        
        // Get analytics for top tweets
        const topTweets = tweets.slice(0, 5);
        const topPostsWithAnalytics = await Promise.all(
          topTweets.map(async (tweet) => {
            try {
              const analytics = await twitterService.getTweetAnalytics(tweet.id);
              return {
                id: tweet.id,
                content: tweet.text,
                impressions: analytics.impressions || 0,
                engagement: analytics.likes + analytics.retweets + analytics.replies || 0,
                date: new Date(tweet.created_at).toISOString().split('T')[0]
              };
            } catch (err) {
              console.error(`Error fetching analytics for tweet ${tweet.id}:`, err);
              return {
                id: tweet.id,
                content: tweet.text,
                impressions: tweet.likes_count * 5, // Estimate impressions
                engagement: tweet.likes_count + tweet.retweets_count + tweet.replies_count,
                date: new Date(tweet.created_at).toISOString().split('T')[0]
              };
            }
          })
        );
        
        // Sort by engagement
        topPostsWithAnalytics.sort((a, b) => b.engagement - a.engagement);
        
        // Generate time series data based on tweets and timeframe
        const timeSeriesData = generateTimeSeriesData(tweets, timeframe);
        
        setAnalyticsData({
          ...timeSeriesData,
          topPosts: topPostsWithAnalytics
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data. Please try again later.');
        
        // Fallback to mock data
        const mockData = generateMockData(timeframe);
        setAnalyticsData(mockData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [timeframe, currentUser]);

  // Generate time series data from tweets
  const generateTimeSeriesData = (tweets, timeframe) => {
    let dateFormat, groupingFunction;
    let daysToInclude;
    
    switch (timeframe) {
      case 'week':
        daysToInclude = 7;
        dateFormat = date => date.toLocaleDateString();
        groupingFunction = date => date.toLocaleDateString();
        break;
      case 'month':
        daysToInclude = 30;
        dateFormat = date => date.toLocaleDateString();
        groupingFunction = date => date.toLocaleDateString();
        break;
      case 'year':
        daysToInclude = 12;
        dateFormat = date => date.toLocaleString('default', { month: 'short' });
        groupingFunction = date => date.toLocaleString('default', { month: 'short' });
        break;
      default:
        daysToInclude = 7;
        dateFormat = date => date.toLocaleDateString();
        groupingFunction = date => date.toLocaleDateString();
    }
    
    // Create date buckets
    const now = new Date();
    const dateBuckets = [];
    
    if (timeframe === 'year') {
      // For year view, use months
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - 11 + i);
        dateBuckets.push({
          date: date,
          formattedDate: dateFormat(date),
          key: groupingFunction(date)
        });
      }
    } else {
      // For week/month view, use days
      for (let i = 0; i < daysToInclude; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - (daysToInclude - 1) + i);
        dateBuckets.push({
          date: date,
          formattedDate: dateFormat(date),
          key: groupingFunction(date)
        });
      }
    }
    
    // Group tweets by date
    const tweetsByDate = {};
    tweets.forEach(tweet => {
      const tweetDate = new Date(tweet.created_at);
      const key = groupingFunction(tweetDate);
      
      if (!tweetsByDate[key]) {
        tweetsByDate[key] = [];
      }
      
      tweetsByDate[key].push(tweet);
    });
    
    // Generate impressions, engagement, and followers data
    const impressions = dateBuckets.map(bucket => {
      const tweetsInBucket = tweetsByDate[bucket.key] || [];
      const totalImpressions = tweetsInBucket.reduce((sum, tweet) => 
        sum + (tweet.likes_count * 5), 0); // Estimate impressions as 5x likes
      
      return {
        date: bucket.formattedDate,
        value: totalImpressions || 0
      };
    });
    
    const engagement = dateBuckets.map(bucket => {
      const tweetsInBucket = tweetsByDate[bucket.key] || [];
      const totalEngagement = tweetsInBucket.reduce((sum, tweet) => 
        sum + tweet.likes_count + tweet.retweets_count + tweet.replies_count, 0);
      
      return {
        date: bucket.formattedDate,
        value: totalEngagement || 0
      };
    });
    
    // Mock follower growth based on engagement
    const followers = [];
    let followerCount = 1000; // Starting point
    
    dateBuckets.forEach((bucket, index) => {
      // Increase followers based on engagement
      const engagementValue = engagement[index].value;
      const followerIncrease = Math.floor(engagementValue * 0.1) + Math.floor(Math.random() * 10);
      
      followerCount += followerIncrease;
      
      followers.push({
        date: bucket.formattedDate,
        value: followerCount
      });
    });
    
    return { impressions, engagement, followers };
  };

  // Generate mock data based on timeframe (fallback)
  const generateMockData = (timeframe) => {
    let days;
    let multiplier;
    
    switch (timeframe) {
      case 'week':
        days = 7;
        multiplier = 1;
        break;
      case 'month':
        days = 30;
        multiplier = 4;
        break;
      case 'year':
        days = 12; // We'll use months for year view
        multiplier = 30;
        break;
      default:
        days = 7;
        multiplier = 1;
    }
    
    const impressions = [];
    const engagement = [];
    const followers = [];
    
    // Generate time series data
    for (let i = 0; i < days; i++) {
      const date = timeframe === 'year' 
        ? `Month ${i + 1}` 
        : new Date(Date.now() - (days - i - 1) * 86400000).toLocaleDateString();
      
      impressions.push({
        date,
        value: Math.floor(Math.random() * 1000 * multiplier) + 500 * multiplier
      });
      
      engagement.push({
        date,
        value: Math.floor(Math.random() * 200 * multiplier) + 100 * multiplier
      });
      
      followers.push({
        date,
        value: 1000 + (i * 10 * multiplier) + Math.floor(Math.random() * 20 * multiplier)
      });
    }
    
    // Generate top posts
    const topPosts = [
      {
        id: 1,
        content: 'Excited to announce our new feature launch!',
        impressions: 12500,
        engagement: 843,
        date: '2023-10-10'
      },
      {
        id: 2,
        content: 'Thanks to everyone who participated in our recent survey. The results are in!',
        impressions: 8700,
        engagement: 621,
        date: '2023-10-05'
      },
      {
        id: 3,
        content: 'Check out our latest blog post on industry trends for 2023.',
        impressions: 7200,
        engagement: 512,
        date: '2023-09-28'
      }
    ];
    
    return { impressions, engagement, followers, topPosts };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        
        <div className="flex items-center">
          {twitterUsername && (
            <div className="text-sm text-gray-600 mr-4">
              Viewing data for: <span className="font-semibold text-twitter-blue">@{twitterUsername}</span>
            </div>
          )}
          
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                timeframe === 'week' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setTimeframe('week')}
            >
              Week
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                timeframe === 'month' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setTimeframe('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                timeframe === 'year' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setTimeframe('year')}
            >
              Year
            </button>
          </div>
        </div>
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
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Impressions</h3>
              <p className="text-3xl font-bold">
                {analyticsData.impressions.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {timeframe === 'week' ? 'This week' : timeframe === 'month' ? 'This month' : 'This year'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Engagement</h3>
              <p className="text-3xl font-bold">
                {analyticsData.engagement.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {timeframe === 'week' ? 'This week' : timeframe === 'month' ? 'This month' : 'This year'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Current Followers</h3>
              <p className="text-3xl font-bold">
                {analyticsData.followers.length > 0 
                  ? analyticsData.followers[analyticsData.followers.length - 1].value.toLocaleString()
                  : '0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {analyticsData.followers.length > 1 && 
                  `+${(analyticsData.followers[analyticsData.followers.length - 1].value - 
                    analyticsData.followers[0].value).toLocaleString()} growth`}
              </p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Impressions</h3>
              <div className="h-64 flex items-end">
                {analyticsData.impressions.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-blue-500 w-4/5" 
                      style={{ 
                        height: `${(item.value / 2000) * 100}%`,
                        maxHeight: '90%',
                        minHeight: '5%'
                      }}
                    ></div>
                    <span className="text-xs mt-2 text-gray-500">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Engagement</h3>
              <div className="h-64 flex items-end">
                {analyticsData.engagement.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-green-500 w-4/5" 
                      style={{ 
                        height: `${(item.value / 400) * 100}%`,
                        maxHeight: '90%',
                        minHeight: '5%'
                      }}
                    ></div>
                    <span className="text-xs mt-2 text-gray-500">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Top Performing Posts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-medium">Top Performing Posts</h2>
            </div>
            {analyticsData.topPosts.length > 0 ? (
              <div className="divide-y">
                {analyticsData.topPosts.map(post => (
                  <div key={post.id} className="p-6">
                    <p className="mb-2">{post.content}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Posted on {post.date}</span>
                      <span>{post.impressions.toLocaleString()} impressions</span>
                      <span>{post.engagement.toLocaleString()} engagements</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No posts found for this time period.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;