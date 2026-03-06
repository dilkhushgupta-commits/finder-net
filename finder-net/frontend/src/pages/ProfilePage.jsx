import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userService, itemService } from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiEdit2,
  FiSave,
  FiX,
  FiCamera,
  FiMapPin,
  FiClock,
  FiPackage,
  FiSettings,
  FiBell,
  FiLock,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (activeTab === 'items') {
      fetchMyItems();
    }
  }, [activeTab]);

  const fetchMyItems = async () => {
    setItemsLoading(true);
    try {
      const response = await itemService.getUserItems();
      const resData = response.data?.data?.items || response.data?.data || response.data || [];
      setMyItems(Array.isArray(resData) ? resData : []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load your items');
    } finally {
      setItemsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await userService.updateProfile(formData);
      updateUser(response.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      resolved: 'bg-blue-100 text-blue-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'items', label: 'My Items', icon: FiPackage },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'notifications', label: 'Notifications', icon: FiBell }
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Profile Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700">
                <FiCamera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                Member since {formatDate(user?.created_at || user?.createdAt)}
              </p>
            </div>

            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{myItems.filter(i => i.type === 'lost').length}</p>
                <p className="text-sm text-gray-500">Lost</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{myItems.filter(i => i.type === 'found').length}</p>
                <p className="text-sm text-gray-500">Found</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{myItems.filter(i => i.status === 'resolved').length}</p>
                <p className="text-sm text-gray-500">Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary flex items-center"
                  >
                    <FiEdit2 className="mr-2" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="btn-secondary flex items-center"
                    >
                      <FiX className="mr-2" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="btn-primary flex items-center"
                    >
                      {loading ? (
                        <span className="spinner mr-2"></span>
                      ) : (
                        <FiSave className="mr-2" />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiUser className="inline mr-2" /> Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiMail className="inline mr-2" /> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={true}
                    className="input disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FiPhone className="inline mr-2" /> Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Not provided"
                    className="input disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Tell us a bit about yourself..."
                    className="input min-h-[100px] disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* My Items Tab */}
          {activeTab === 'items' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {itemsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="card p-4 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myItems.length === 0 ? (
                <div className="card p-12 text-center">
                  <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">No items reported yet</h3>
                  <p className="text-gray-500 mb-4">Start by reporting a lost or found item</p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/report-lost" className="btn-primary">
                      Report Lost Item
                    </Link>
                    <Link to="/report-found" className="btn-secondary">
                      Report Found Item
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {myItems.map(item => (
                    <Link
                      key={item.id || item._id}
                      to={`/items/${item.id || item._id}`}
                      className="card p-4 flex gap-4 hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={resolveImageUrl(item.images?.[0]?.url)}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {item.type === 'lost' ? <FiAlertCircle className="inline mr-1" /> : <FiCheckCircle className="inline mr-1" />}
                            {item.type.toUpperCase()}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-3">
                          <span className="flex items-center">
                            <FiMapPin className="mr-1" /> {item.location?.city}
                          </span>
                          <span className="flex items-center">
                            <FiClock className="mr-1" /> {formatDate(item.date)}
                          </span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-6"
            >
              <h2 className="text-xl font-semibold mb-6">Change Password</h2>

              <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="input"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-6"
            >
              <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                {[
                  { id: 'email_matches', label: 'AI Match Alerts', desc: 'Get notified when AI finds potential matches' },
                  { id: 'email_messages', label: 'New Messages', desc: 'Get notified when someone messages you' },
                  { id: 'email_status', label: 'Status Updates', desc: 'Get notified when your item status changes' },
                  { id: 'email_newsletter', label: 'Newsletter', desc: 'Receive tips and updates from FinderNet' }
                ].map(pref => (
                  <div key={pref.id} className="flex items-center justify-between py-3 border-b dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium">{pref.label}</p>
                      <p className="text-sm text-gray-500">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
