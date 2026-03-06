"""
Similarity Matcher Module
Calculate similarity between feature vectors using cosine similarity
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class SimilarityMatcher:
    def __init__(self):
        """
        Initialize similarity matcher
        """
        pass
    
    def calculate_similarity(self, features1, features2):
        """
        Calculate cosine similarity between two feature vectors
        
        Args:
            features1: First feature vector (numpy array or list)
            features2: Second feature vector (numpy array or list)
        
        Returns:
            Similarity score between 0 and 1
        """
        try:
            # Convert to numpy arrays if needed
            if isinstance(features1, list):
                features1 = np.array(features1)
            if isinstance(features2, list):
                features2 = np.array(features2)
            
            # Ensure 2D arrays for sklearn
            features1 = features1.reshape(1, -1)
            features2 = features2.reshape(1, -1)
            
            # Calculate cosine similarity
            similarity = cosine_similarity(features1, features2)[0][0]
            
            # Ensure value is between 0 and 1
            similarity = max(0.0, min(1.0, similarity))
            
            return float(similarity)
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            return 0.0
    
    def batch_similarity(self, query_features, candidate_features_list):
        """
        Calculate similarity between one query and multiple candidates
        
        Args:
            query_features: Query feature vector
            candidate_features_list: List of candidate feature vectors
        
        Returns:
            List of similarity scores
        """
        try:
            if isinstance(query_features, list):
                query_features = np.array(query_features)
            
            query_features = query_features.reshape(1, -1)
            
            similarities = []
            for candidate in candidate_features_list:
                if isinstance(candidate, list):
                    candidate = np.array(candidate)
                candidate = candidate.reshape(1, -1)
                
                sim = cosine_similarity(query_features, candidate)[0][0]
                sim = max(0.0, min(1.0, sim))
                similarities.append(float(sim))
            
            return similarities
        except Exception as e:
            print(f"Error in batch similarity calculation: {e}")
            return [0.0] * len(candidate_features_list)
    
    def euclidean_distance(self, features1, features2):
        """
        Calculate Euclidean distance (alternative similarity metric)
        """
        try:
            if isinstance(features1, list):
                features1 = np.array(features1)
            if isinstance(features2, list):
                features2 = np.array(features2)
            
            distance = np.linalg.norm(features1 - features2)
            
            # Convert distance to similarity (0-1 scale)
            # Using exponential decay
            similarity = np.exp(-distance / 10)
            
            return float(similarity)
        except Exception as e:
            print(f"Error calculating euclidean distance: {e}")
            return 0.0
