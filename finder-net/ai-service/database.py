"""
Database Module
Supabase connection and operations (replaces MongoDB)
"""

from supabase import create_client, Client
from typing import List, Dict, Optional
import os


class Database:
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize Supabase connection
        """
        self.client: Optional[Client] = None
        self._connected = False
        self._connect(
            supabase_url or os.getenv('SUPABASE_URL'),
            supabase_key or os.getenv('SUPABASE_SERVICE_KEY')
        )

    def _connect(self, supabase_url: str, supabase_key: str):
        """
        Connect to Supabase
        """
        try:
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required")

            self.client = create_client(supabase_url, supabase_key)

            # Test connection
            self.client.table('items').select('id').limit(1).execute()
            print("[OK] Connected to Supabase successfully")
            self._connected = True
        except Exception as e:
            print(f"[WARNING] Supabase connection error: {e}")
            print("[INFO] AI service will run in standalone mode without database")
            self._connected = False

    def is_connected(self):
        """
        Check if database is connected
        """
        if not self._connected or not self.client:
            return False
        try:
            self.client.table('items').select('id').limit(1).execute()
            return True
        except:
            return False

    async def update_item_features(self, item_id: str, features: List[float]):
        """
        Update item with extracted AI features
        """
        try:
            result = self.client.table('items').update(
                {'ai_feature_vector': features}
            ).eq('id', item_id).execute()
            return len(result.data) > 0
        except Exception as e:
            print(f"Error updating item features: {e}")
            raise

    async def get_items_by_type_and_category(
        self,
        item_type: str,
        category: str
    ) -> List[Dict]:
        """
        Get items by type and category for matching
        Note: Returns opposite type (lost finds found, found finds lost)
        """
        try:
            # Find opposite type
            opposite_type = 'found' if item_type == 'lost' else 'lost'

            result = self.client.table('items').select(
                'id, ai_feature_vector'
            ).eq(
                'type', opposite_type
            ).eq(
                'category', category
            ).eq(
                'status', 'approved'
            ).eq(
                'is_active', True
            ).not_.is_(
                'ai_feature_vector', 'null'
            ).execute()

            # Convert to dict format compatible with existing code
            items = []
            for row in result.data:
                items.append({
                    '_id': row['id'],
                    'aiFeatureVector': row['ai_feature_vector']
                })

            return items
        except Exception as e:
            print(f"Error fetching items: {e}")
            return []

    async def get_all_items_with_features(self) -> List[Dict]:
        """
        Get all items that have feature vectors
        """
        try:
            result = self.client.table('items').select(
                'id, ai_feature_vector'
            ).eq(
                'is_active', True
            ).not_.is_(
                'ai_feature_vector', 'null'
            ).execute()

            items = []
            for row in result.data:
                items.append({
                    '_id': row['id'],
                    'aiFeatureVector': row['ai_feature_vector']
                })

            return items
        except Exception as e:
            print(f"Error fetching all items: {e}")
            return []

    async def get_item_by_id(self, item_id: str) -> Optional[Dict]:
        """
        Get single item by ID
        """
        try:
            result = self.client.table('items').select('*').eq('id', item_id).execute()
            if result.data:
                row = result.data[0]
                row['_id'] = row['id']
                return row
            return None
        except Exception as e:
            print(f"Error fetching item: {e}")
            return None

    def close(self):
        """
        Close database connection (no-op for Supabase REST client)
        """
        print("Supabase connection closed")
