import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  FiSearch,
  FiPlus,
  FiPlusCircle,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        itemService.getMyItems(),
        itemService.getStats()
      ]);

      setMyItems(itemsRes.data?.data?.items || itemsRes.data?.items || []);
      setStats(statsRes.data?.data || statsRes.data || null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Items Reported',
      value: user?.items_reported || user?.itemsReported || 0,
      icon: <FiPlusCircle className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      label: 'Items Recovered',
      value: user?.items_recovered || user?.itemsRecovered || 0,
      icon: <FiCheckCircle className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      label: 'Pending Matches',
      value: myItems.filter(i => i.status === 'matched').length,
      icon: <FiAlertTriangle className="w-8 h-8" />,
      color: 'bg-yellow-500'
    },
    {
      label: 'Recovery Rate',
      value: stats?.overall?.recoveryRate ? `${stats.overall.recoveryRate}%` : '0%',
      icon: <FiTrendingUp className="w-8 h-8" />,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
        <p className="text-primary-100 mb-6">
          Manage your lost and found reports, track matches, and connect with others.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/report-lost" className="px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            <FiPlus className="inline-block mr-2" />
            Report Lost Item
          </Link>
          <Link to="/report-found" className="px-6 py-3 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors border border-white/30">
            <FiPlus className="inline-block mr-2" />
            Report Found Item
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Items */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">My Recent Reports</h2>
          <Link to="/profile" className="text-primary-600 hover:underline text-sm">
            View All →
          </Link>
        </div>

        {myItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiSearch className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No items reported yet</p>
            <p className="text-sm mt-2">Start by reporting a lost or found item</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myItems.slice(0, 6).map((item) => (
              <Link
                key={item.id || item._id}
                to={`/items/${item.id || item._id}`}
                className="block bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-40 bg-gray-200 dark:bg-gray-600">
                  <img
                    src={resolveImageUrl(item.images?.[0]?.url)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {item.type?.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.status === 'approved' ? 'bg-green-100 text-green-700' :
                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      item.status === 'matched' ? 'bg-blue-100 text-blue-700' :
                      item.status === 'recovered' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                    <FiClock className="mr-1" />
                    {new Date(item.created_at || item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/items?type=lost" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
              <FiSearch className="w-8 h-8 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <h3 className="font-semibold">Browse Lost Items</h3>
              <p className="text-sm text-gray-500">Help reunite items with owners</p>
            </div>
          </div>
        </Link>

        <Link to="/items?type=found" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
              <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h3 className="font-semibold">Browse Found Items</h3>
              <p className="text-sm text-gray-500">Check if your item was found</p>
            </div>
          </div>
        </Link>

        <Link to="/chat" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
              <FiTrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold">View Messages</h3>
              <p className="text-sm text-gray-500">Connect with potential matches</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
