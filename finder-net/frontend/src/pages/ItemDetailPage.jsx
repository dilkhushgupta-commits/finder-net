import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { itemService, matchService, chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  FiMapPin,
  FiClock,
  FiTag,
  FiUser,
  FiMessageCircle,
  FiZap,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiExternalLink,
  FiShare2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await itemService.getItemById(id);
      const resData = response.data.data || response.data;
      setItem(resData.item || resData);
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item details');
      navigate('/items');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setMatchLoading(true);
    try {
      const response = await matchService.findMatches(id);
      setMatches(response.data.matches || []);
      if (response.data.matches?.length === 0) {
        toast.info('No potential matches found at this time');
      } else {
        toast.success(`Found ${response.data.matches.length} potential matches!`);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Failed to find matches');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!item || !item.uploaded_by_user) {
      toast.error('Cannot start chat with this item owner');
      return;
    }

    setChatLoading(true);
    try {
      const response = await chatService.getOrCreateChat(item.uploaded_by_user.id, id);
      const chatData = response.data.data || response.data;
      navigate(`/chat/${chatData.id || chatData._id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: item.title,
        text: `${item.type === 'lost' ? 'Lost' : 'Found'}: ${item.title}`,
        url: window.location.href
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Item not found</h2>
        <Link to="/items" className="text-primary-600 hover:underline">
          Browse all items
        </Link>
      </div>
    );
  }

  const isOwner = user && item.uploaded_by === user.id;

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back Link */}
        <Link
          to="/items"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <FiChevronLeft className="mr-1" /> Back to Items
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={resolveImageUrl(item.images?.[currentImageIndex]?.url)}
                alt={item.title}
                className="w-full h-96 object-cover"
              />

              {/* Type Badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                    item.type === 'lost'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {item.type === 'lost' ? (
                    <FiAlertCircle className="mr-1" />
                  ) : (
                    <FiCheckCircle className="mr-1" />
                  )}
                  {item.type.toUpperCase()}
                </span>
              </div>

              {/* Image Navigation */}
              {item.images?.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev =>
                      prev === 0 ? item.images.length - 1 : prev - 1
                    )}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev =>
                      prev === item.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {item.images?.length > 1 && (
              <div className="flex gap-2">
                {item.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === index
                        ? 'border-primary-500'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={resolveImageUrl(img.url)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <span className="text-sm text-primary-600 font-medium">
                <FiTag className="inline mr-1" />
                {item.category}
              </span>
              <h1 className="text-3xl font-bold mt-2">{item.title}</h1>
            </div>

            <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <FiMapPin className="mr-2" />
                {item.location?.city}, {item.location?.state}
              </span>
              <span className="flex items-center">
                <FiClock className="mr-2" />
                {formatDate(item.date)}
              </span>
            </div>

            <div className="card p-4">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            {/* Location Details */}
            <div className="card p-4">
              <h3 className="font-medium mb-2">Location Details</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {item.location?.address}<br />
                {item.location?.city}, {item.location?.state}<br />
                {item.location?.country}
              </p>
            </div>

            {/* Reported By */}
            {item.uploaded_by_user && (
              <div className="card p-4">
                <h3 className="font-medium mb-2">Reported By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <FiUser className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium">{item.uploaded_by_user.name}</p>
                    <p className="text-sm text-gray-500">
                      Posted {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {!isOwner && (
                <>
                  <button
                    onClick={handleStartChat}
                    disabled={chatLoading}
                    className="btn-primary flex items-center"
                  >
                    {chatLoading ? (
                      <span className="spinner mr-2"></span>
                    ) : (
                      <FiMessageCircle className="mr-2" />
                    )}
                    Contact Owner
                  </button>
                </>
              )}

              {isOwner && (
                <button
                  onClick={handleFindMatches}
                  disabled={matchLoading}
                  className="btn-primary flex items-center"
                >
                  {matchLoading ? (
                    <span className="spinner mr-2"></span>
                  ) : (
                    <FiZap className="mr-2" />
                  )}
                  Find AI Matches
                </button>
              )}

              <button
                onClick={handleShare}
                className="btn-secondary flex items-center"
              >
                <FiShare2 className="mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* AI Matches Section */}
        {matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FiZap className="mr-2 text-yellow-500" />
              AI-Powered Matches ({matches.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, index) => (
                <Link
                  key={match.id}
                  to={`/items/${match.id}`}
                  className="card group overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={resolveImageUrl(match.images?.[0]?.url)}
                      alt={match.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      {Math.round((match.score || 0.8) * 100)}% Match
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary-600">
                      {match.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <FiMapPin className="inline mr-1" />
                      {match.location?.city}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ItemDetailPage;
