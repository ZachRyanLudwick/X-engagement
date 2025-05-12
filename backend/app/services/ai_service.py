import os
import openai
from typing import List, Dict, Any, Optional
import logging
import json
import re

from app.models.content import (
    ContentRequest, ContentResponse, ContentVariant, ToneSettings,
    ThreadRequest, ThreadResponse, ThreadTweet,
    ToneAnalysisRequest, ToneAnalysisResponse,
    PerformancePredictionRequest, PerformancePredictionResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    """Service for AI-powered content generation using OpenAI's GPT models."""
    
    def __init__(self):
        # In production, get this from environment variables
        openai.api_key = os.getenv("OPENAI_API_KEY", "your-api-key")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4")
    
    async def generate_content(self, request: ContentRequest) -> ContentResponse:
        """Generate content based on the request parameters."""
        try:
            # Build the prompt based on content type and tone
            prompt = self._build_prompt(request)
            
            # Adjust temperature based on tone strength
            temperature = 0.7
            if request.tone.tone_strength < 0.5:
                temperature = 0.5  # More conservative for lower tone strength
            elif request.tone.tone_strength > 0.8:
                temperature = 0.9  # More creative for higher tone strength
            
            # Number of variants to generate
            n_variants = 1 if request.is_preview else 3
            
            # Call OpenAI API
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt(request.tone)},
                    {"role": "user", "content": prompt}
                ],
                n=n_variants,
                max_tokens=request.max_length,
                temperature=temperature,
            )
            
            # Process the response
            variants = []
            for choice in response.choices:
                content = choice.message.content.strip()
                
                # Generate performance prediction for non-preview requests
                performance_prediction = None
                if not request.is_preview:
                    performance_prediction = await self._predict_performance(content, request.content_type)
                
                variants.append(
                    ContentVariant(
                        text=content,
                        score=1.0 - choice.index * 0.1,  # Simple scoring based on order
                        performance_prediction=performance_prediction
                    )
                )
            
            return ContentResponse(
                variants=variants,
                source_text=request.source_text,
                tone_used=request.tone
            )
            
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}")
            raise
    
    async def generate_thread(self, request: ThreadRequest) -> ThreadResponse:
        """Generate a thread of tweets based on the request parameters."""
        try:
            # Build the prompt for thread generation
            prompt = self._build_thread_prompt(request)
            
            # Call OpenAI API
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_thread_system_prompt(request.tone)},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=request.num_tweets * request.max_length_per_tweet,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content = response.choices[0].message.content
            try:
                thread_data = json.loads(content)
                tweets = []
                
                # Extract tweets from the response
                for i, tweet_text in enumerate(thread_data.get("tweets", [])):
                    tweets.append(
                        ThreadTweet(
                            position=i,
                            text=tweet_text
                        )
                    )
                
                # If we didn't get enough tweets, generate more
                if len(tweets) < request.num_tweets:
                    logger.warning(f"Only got {len(tweets)} tweets, expected {request.num_tweets}")
                    # In a real implementation, you might want to generate more tweets here
                
                return ThreadResponse(
                    tweets=tweets,
                    main_topic=request.main_topic,
                    tone_used=request.tone
                )
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract tweets using regex
                logger.warning("Failed to parse JSON response, falling back to regex extraction")
                tweet_texts = re.findall(r'(?:Tweet|Post) \d+: "(.*?)"', content)
                tweets = [
                    ThreadTweet(position=i, text=text)
                    for i, text in enumerate(tweet_texts[:request.num_tweets])
                ]
                
                return ThreadResponse(
                    tweets=tweets,
                    main_topic=request.main_topic,
                    tone_used=request.tone
                )
                
        except Exception as e:
            logger.error(f"Error generating thread: {str(e)}")
            raise
    
    async def analyze_tone(self, text: str) -> Dict[str, Any]:
        """Analyze the tone of a given text."""
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a tone analysis expert. Analyze the tone of the given text and provide percentages for different tone categories."},
                    {"role": "user", "content": f"Analyze the tone of this text and provide percentages for different tone categories (professional, casual, witty, sarcastic, motivational, etc.):\n\n{text}"}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content = response.choices[0].message.content
            try:
                analysis_data = json.loads(content)
                return {
                    "analysis": analysis_data.get("analysis", ""),
                    "tone_breakdown": analysis_data.get("tone_breakdown", {})
                }
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON response for tone analysis")
                # Return a simplified mock result
                return {
                    "analysis": content,
                    "tone_breakdown": {
                        "professional": 0.6,
                        "casual": 0.2,
                        "witty": 0.1,
                        "sarcastic": 0.05,
                        "motivational": 0.05
                    }
                }
            
        except Exception as e:
            logger.error(f"Error analyzing tone: {str(e)}")
            raise
            
    async def match_tone(self, text: str, target_tone: str) -> ToneSettings:
        """Match the tone of a given text to a target tone."""
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a tone matching expert. Extract the tone characteristics from the given text and adapt them to match the target tone."},
                    {"role": "user", "content": f"Extract the tone characteristics from this text:\n\n{text}\n\nAdapt these characteristics to match the '{target_tone}' tone. Provide custom instructions for achieving this tone."}
                ],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content = response.choices[0].message.content
            try:
                tone_data = json.loads(content)
                return ToneSettings(
                    tone_name=target_tone,
                    tone_strength=tone_data.get("tone_strength", 0.7),
                    custom_instructions=tone_data.get("custom_instructions", "")
                )
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON response for tone matching")
                return ToneSettings(
                    tone_name=target_tone,
                    tone_strength=0.7,
                    custom_instructions=f"Match the tone of: {text[:100]}..."
                )
            
        except Exception as e:
            logger.error(f"Error matching tone: {str(e)}")
            raise
    
    async def predict_performance(self, request: PerformancePredictionRequest) -> PerformancePredictionResponse:
        """Predict the performance of content."""
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a social media analytics expert. Predict the performance of the given content based on engagement patterns."},
                    {"role": "user", "content": f"Predict the performance of this {request.content_type}:\n\n{request.text}\n\nProvide engagement predictions and suggestions for improvement."}
                ],
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content = response.choices[0].message.content
            try:
                prediction_data = json.loads(content)
                return PerformancePredictionResponse(
                    engagement_prediction=prediction_data.get("engagement_prediction", {}),
                    improvement_suggestions=prediction_data.get("improvement_suggestions", [])
                )
            except json.JSONDecodeError:
                logger.warning("Failed to parse JSON response for performance prediction")
                return PerformancePredictionResponse(
                    engagement_prediction={
                        "likes": 0.5,
                        "retweets": 0.3,
                        "replies": 0.2,
                        "overall_score": 0.4
                    },
                    improvement_suggestions=[
                        "Add more engaging content",
                        "Use more relevant hashtags",
                        "Ask a question to encourage replies"
                    ]
                )
            
        except Exception as e:
            logger.error(f"Error predicting performance: {str(e)}")
            raise
            
    async def _predict_performance(self, text: str, content_type: str) -> Dict[str, Any]:
        """Internal method to predict performance of content."""
        try:
            # Simplified version for internal use
            return {
                "likes": 0.6,
                "retweets": 0.4,
                "replies": 0.3,
                "overall_score": 0.5
            }
        except Exception as e:
            logger.error(f"Error in internal performance prediction: {str(e)}")
            return {}
    
    def _build_prompt(self, request: ContentRequest) -> str:
        """Build a prompt based on the content request."""
        if request.content_type == "reply":
            prompt = f"Generate a reply to this tweet: \"{request.source_text}\""
            if request.context:
                prompt += f"\n\nAdditional context: {request.context}"
            if request.tweet_metadata:
                hashtags = request.tweet_metadata.get("hashtags", [])
                mentions = request.tweet_metadata.get("mentions", [])
                if hashtags:
                    prompt += f"\n\nHashtags in the original tweet: {', '.join(hashtags)}"
                if mentions:
                    prompt += f"\n\nMentions in the original tweet: {', '.join(mentions)}"
        else:  # post
            prompt = f"Generate a tweet based on this description: \"{request.source_text}\""
        
        prompt += f"\n\nThe tone should be {request.tone.tone_name}"
        if request.tone.custom_instructions:
            prompt += f" with these specific instructions: {request.tone.custom_instructions}"
        
        prompt += f"\n\nKeep it under {request.max_length} characters."
        
        if request.is_preview:
            prompt += "\n\nThis is a preview request, so focus on quality over variety."
        
        return prompt
    
    def _build_thread_prompt(self, request: ThreadRequest) -> str:
        """Build a prompt for thread generation."""
        prompt = f"Generate a thread of {request.num_tweets} tweets about: \"{request.main_topic}\""
        
        if request.keywords:
            prompt += f"\n\nInclude these keywords: {', '.join(request.keywords)}"
        
        prompt += f"\n\nThe tone should be {request.tone.tone_name}"
        if request.tone.custom_instructions:
            prompt += f" with these specific instructions: {request.tone.custom_instructions}"
        
        prompt += f"\n\nKeep each tweet under {request.max_length_per_tweet} characters."
        prompt += "\n\nFormat the response as a JSON object with a 'tweets' array containing the text of each tweet."
        
        return prompt
    
    def _get_system_prompt(self, tone: ToneSettings) -> str:
        """Get the system prompt based on tone settings."""
        base_prompt = "You are an expert social media content creator specializing in X (Twitter)."
        
        tone_instructions = {
            "professional": "Use formal language, industry terminology, and maintain a business-appropriate tone.",
            "witty": "Be clever, use wordplay, and incorporate humor that's intelligent rather than slapstick.",
            "sarcastic": "Use irony and satirical elements, but ensure it doesn't come across as mean-spirited.",
            "motivational": "Be inspiring, use positive language, and incorporate calls to action.",
            "casual": "Use conversational language, contractions, and a friendly, approachable tone.",
            "friendly founder": "Combine approachability with authority, sharing insights while remaining personable.",
            "witty developer": "Use technical humor, coding references, and clever wordplay that resonates with developers."
        }
        
        if tone.tone_name.lower() in tone_instructions:
            base_prompt += f" {tone_instructions[tone.tone_name.lower()]}"
        
        base_prompt += " Create content that is engaging, concise, and optimized for the Twitter platform."
        
        return base_prompt
    
    def _get_thread_system_prompt(self, tone: ToneSettings) -> str:
        """Get the system prompt for thread generation."""
        base_prompt = "You are an expert at creating engaging Twitter threads that maintain narrative coherence across multiple tweets."
        
        tone_instructions = {
            "professional": "Use formal language, industry terminology, and maintain a business-appropriate tone.",
            "witty": "Be clever, use wordplay, and incorporate humor that's intelligent rather than slapstick.",
            "sarcastic": "Use irony and satirical elements, but ensure it doesn't come across as mean-spirited.",
            "motivational": "Be inspiring, use positive language, and incorporate calls to action.",
            "casual": "Use conversational language, contractions, and a friendly, approachable tone.",
            "friendly founder": "Combine approachability with authority, sharing insights while remaining personable.",
            "witty developer": "Use technical humor, coding references, and clever wordplay that resonates with developers."
        }
        
        if tone.tone_name.lower() in tone_instructions:
            base_prompt += f" {tone_instructions[tone.tone_name.lower()]}"
        
        base_prompt += " Create a thread that flows naturally from one tweet to the next, maintaining reader interest throughout."
        base_prompt += " Each tweet should be able to stand on its own while contributing to the overall narrative."
        
        return base_prompt