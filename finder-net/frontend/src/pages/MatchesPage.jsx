import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { matchService } from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  FiZap,
  FiMapPin,
  FiClock,
  FiExternalLink,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, verified, rejected

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await matchService.getUserMatches();
      setMatches(response.data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMatch = async (matchId, status) => {
    try {
      await matchService.updateMatchStatus(matchId, status);
      toast.success(`Match ${status} successfully`);
      fetchMatches();
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Failed to update match status');
    }
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <FiCheckCircle className="mr-1" /> Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <FiXCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <FiAlertCircle className="mr-1" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <FiZap className="mr-3 text-yellow-500" />
              AI Matches
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Potential matches found by our AI matching system
            </p>
          </div>

          <button
            onClick={fetchMatches}
            className="btn-secondary flex items-center"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'verified', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="card p-12 text-center">
            <FiZap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">No matches found</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all'
                ? "Our AI hasn't found any potential matches yet. Keep checking back!"
                : `No ${filter} matches at the moment.`}
            </p>
            <Link to="/items" className="btn-primary">
              Browse Items
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match.id || match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                        {Math.round((match.score || match.confidence || 0.85) * 100)}% Match
                      </span>
                      {getStatusBadge(match.status)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(match.created_at || match.createdAt)}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Lost Item */}
                    <div className="flex gap-4">
                      <img
                        src={resolveImageUrl(match.lostItem?.images?.[0]?.url)}
                        alt={match.lostItem?.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-red-600 flex items-center">
                          <FiAlertCircle className="mr-1" /> LOST ITEM
                        </span>
                        <h3 className="font-semibold mt-1">{match.lostItem?.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <FiMapPin className="mr-1" />
                          {match.lostItem?.location?.city}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <FiClock className="mr-1" />
                          {formatDate(match.lostItem?.date)}
                        </p>
                      </div>
                    </div>

                    {/* Found Item */}
                    <div className="flex gap-4">
                      <img
                        src={resolveImageUrl(match.foundItem?.images?.[0]?.url)}
                        alt={match.foundItem?.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-medium text-green-600 flex items-center">
                          <FiCheckCircle className="mr-1" /> FOUND ITEM
                        </span>
                        <h3 className="font-semibold mt-1">{match.foundItem?.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <FiMapPin className="mr-1" />
                          {match.foundItem?.location?.city}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <FiClock className="mr-1" />
                          {formatDate(match.foundItem?.date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                    <Link
                      to={`/items/${match.lostItem?.id || match.lostItem?._id}`}
                      className="btn-secondary flex items-center text-sm"
                    >
                      <FiExternalLink className="mr-2" />
                      View Lost Item
                    </Link>
                    <Link
                      to={`/items/${match.foundItem?.id || match.foundItem?._id}`}
                      className="btn-secondary flex items-center text-sm"
                    >
                      <FiExternalLink className="mr-2" />
                      View Found Item
                    </Link>

                    {match.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleVerifyMatch(match.id || match._id, 'verified')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center"
                        >
                          <FiCheckCircle className="mr-2" />
                          Confirm Match
                        </button>
                        <button
                          onClick={() => handleVerifyMatch(match.id || match._id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center"
                        >
                          <FiXCircle className="mr-2" />
                          Not a Match
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="card p-6 mt-8 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            How AI Matching Works
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Our AI uses deep learning to analyze item images and descriptions</li>
            <li>• ResNet50 neural network extracts visual features from images</li>
            <li>• Cosine similarity compares items to find potential matches</li>
            <li>• Higher percentage = higher likelihood of being the same item</li>
            <li>• Always verify matches manually before claiming an item</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default MatchesPage;
