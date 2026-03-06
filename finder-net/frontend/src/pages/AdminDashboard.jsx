import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminService } from '../services/api';
import {
  FiUsers,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertTriangle,
  FiTrendingUp,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    pendingItems: 0,
    resolvedItems: 0,
    totalMatches: 0
  });
  const [pendingItems, setPendingItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, usersRes] = await Promise.all([
        adminService.getStats(),
        adminService.getPendingItems(),
        adminService.getAllUsers()
      ]);

      setStats(statsRes.data);
      setPendingItems(pendingRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveItem = async (itemId) => {
    try {
      await adminService.updateItemStatus(itemId, 'approved');
      toast.success('Item approved successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving item:', error);
      toast.error('Failed to approve item');
    }
  };

  const handleRejectItem = async (itemId) => {
    try {
      await adminService.updateItemStatus(itemId, 'rejected');
      toast.success('Item rejected');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting item:', error);
      toast.error('Failed to reject item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await adminService.deleteItem(itemId);
      toast.success('Item deleted successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await adminService.updateUserStatus(userId, newStatus);
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'blue' },
    { label: 'Total Items', value: stats.totalItems, icon: FiPackage, color: 'purple' },
    { label: 'Pending Approval', value: stats.pendingItems, icon: FiClock, color: 'yellow' },
    { label: 'Resolved Items', value: stats.resolvedItems, icon: FiCheckCircle, color: 'green' },
    { label: 'AI Matches', value: stats.totalMatches, icon: FiTrendingUp, color: 'pink' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'pending', label: `Pending (${pendingItems.length})` },
    { id: 'users', label: 'Users' }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users, items, and system settings
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            className="btn-secondary flex items-center"
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card p-4 border-l-4 border-${stat.color}-500`}
            >
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center mb-3`}>
                <stat.icon className={`text-${stat.color}-600`} />
              </div>
              <p className="text-2xl font-bold">
                {loading ? '--' : stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Pending Items */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Pending Items</h3>
                <Link to="#" onClick={() => setActiveTab('pending')} className="text-primary-600 hover:underline text-sm">
                  View All
                </Link>
              </div>

              {pendingItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending items</p>
              ) : (
                <div className="space-y-4">
                  {pendingItems.slice(0, 5).map(item => (
                    <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <img
                        src={item.images?.[0]?.url || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveItem(item._id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                        >
                          <FiCheckCircle />
                        </button>
                        <button
                          onClick={() => handleRejectItem(item._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <FiXCircle />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Users */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Users</h3>
                <Link to="#" onClick={() => setActiveTab('users')} className="text-primary-600 hover:underline text-sm">
                  View All
                </Link>
              </div>

              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No users found</p>
              ) : (
                <div className="space-y-4">
                  {users.slice(0, 5).map(user => (
                    <div key={user._id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold">Items Pending Approval</h3>
            </div>

            {pendingItems.length === 0 ? (
              <div className="p-12 text-center">
                <FiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-gray-500">No items pending approval</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {pendingItems.map(item => (
                  <div key={item._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-start gap-4">
                      <img
                        src={item.images?.[0]?.url || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {item.type.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">{item.category}</span>
                        </div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>By: {item.reportedBy?.name}</span>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to={`/items/${item._id}`}
                          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="View"
                        >
                          <FiEye />
                        </Link>
                        <button
                          onClick={() => handleApproveItem(item._id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          title="Approve"
                        >
                          <FiCheckCircle />
                        </button>
                        <button
                          onClick={() => handleRejectItem(item._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Reject"
                        >
                          <FiXCircle />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold">User Management</h3>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(user._id, user.status || 'active')}
                            className={`p-2 rounded-lg ${
                              user.status === 'active' || !user.status
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={user.status === 'active' || !user.status ? 'Suspend User' : 'Activate User'}
                          >
                            {user.status === 'active' || !user.status ? <FiUserX /> : <FiUserCheck />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
