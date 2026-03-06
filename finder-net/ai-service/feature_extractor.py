"""
Feature Extractor Module
Uses pre-trained ResNet50 for image feature extraction
"""

import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import numpy as np
import requests
from io import BytesIO
import cv2
import ssl
import urllib.request
import certifi
import os

class FeatureExtractor:
    def __init__(self, model_name='resnet50'):
        """
        Initialize feature extractor with pre-trained model
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_name = model_name
        self.model = None
        self.transform = None
        self._load_model()
        
    def _load_model(self):
        """
        Load pre-trained ResNet50 model
        """
        try:
            # Configure torch hub cache directory
            torch_home = os.path.expanduser("~/.cache/torch")
            os.environ['TORCH_HOME'] = torch_home
            
            # Handle SSL certificate verification
            ssl._create_default_https_context = ssl._create_unverified_context
            
            # Load pre-trained ResNet50 with modern API
            self.model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            
            # Remove the final classification layer
            self.model = torch.nn.Sequential(*list(self.model.children())[:-1])
            
            # Set to evaluation mode
            self.model.eval()
            self.model.to(self.device)
            
            # Define image transformations
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
            
            print(f"[OK] Model {self.model_name} loaded successfully on {self.device}")
        except Exception as e:
            print(f"[ERROR] Error loading model: {e}")
            raise
    
    def is_loaded(self):
        """
        Check if model is loaded
        """
        return self.model is not None
    
    async def extract_from_url(self, image_url: str) -> np.ndarray:
        """
        Extract features from image URL
        """
        try:
            # Download image
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Open image
            image = Image.open(BytesIO(response.content)).convert('RGB')
            
            # Extract features
            features = self._extract_features(image)
            
            return features
        except Exception as e:
            print(f"Error extracting features from URL: {e}")
            raise
    
    async def extract_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        """
        Extract features from image bytes
        """
        try:
            # Open image
            image = Image.open(BytesIO(image_bytes)).convert('RGB')
            
            # Extract features
            features = self._extract_features(image)
            
            return features
        except Exception as e:
            print(f"Error extracting features from bytes: {e}")
            raise
    
    def _extract_features(self, image: Image.Image) -> np.ndarray:
        """
        Extract feature vector from PIL Image
        """
        try:
            # Apply transformations
            img_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Extract features (no gradient computation)
            with torch.no_grad():
                features = self.model(img_tensor)
            
            # Flatten and convert to numpy
            features = features.squeeze().cpu().numpy().flatten()
            
            # Normalize features
            features = features / (np.linalg.norm(features) + 1e-8)
            
            return features
        except Exception as e:
            print(f"Error in feature extraction: {e}")
            raise
    
    def extract_from_path(self, image_path: str) -> np.ndarray:
        """
        Extract features from local image file
        """
        try:
            image = Image.open(image_path).convert('RGB')
            return self._extract_features(image)
        except Exception as e:
            print(f"Error extracting features from path: {e}")
            raise
