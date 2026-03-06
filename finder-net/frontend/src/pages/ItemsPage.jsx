import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { itemService } from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  FiSearch,
  FiFilter,
  FiX,
  FiMapPin,
  FiClock,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'All',
  'Electronics',
  'Clothing',
  'Accessories',
  'Documents',
  'Bags',
  'Jewelry',
  'Keys',
  'Pets',
  'Sports Equipment',
  'Books',
  'Wallets',
  'Mobile Phones',
  'Laptops',
  'Watches',
  'Other'
];

const ItemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || 'All',
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || ''
  });

  useEffect(() => {
    fetchItems();
  }, [filters, searchParams.get('page')]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const page = parseInt(searchParams.get('page')) || 1;
      const params = {
        page,
        limit: 12,
        status: 'approved'
      };

      if (filters.type !== 'all') params.type = filters.type;
      if (filters.category !== 'All') params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;

      const response = await itemService.getAllItems(params);
      const resData = response.data.data || response.data;
      setItems(resData.items || []);
      setPagination({
        page: resData.pagination?.page || 1,
        totalPages: resData.pagination?.pages || resData.pagination?.totalPages || 1,
        total: resData.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'All') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      category: 'All',
      search: '',
      city: ''
    });
    setSearchParams({});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Browse Items</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {pagination.total} items found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2 md:hidden"
          >
            <FiFilter /> Filters
          </button>
          <div className="flex border rounded-lg overflow-hidden dark:border-gray-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside
          className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}
        >
          <div className="card p-4 sticky top-24 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search items..."
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Item Type</label>
              <div className="flex gap-2">
                {['all', 'lost', 'found'].map(type => (
                  <button
                    key={type}
                    onClick={() => handleFilterChange('type', type)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      filters.type === type
                        ? type === 'lost'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                          : type === 'found'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                            : 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city..."
                className="input"
              />
            </div>
          </div>
        </aside>

        {/* Items Grid/List */}
        <main className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card p-12 text-center">
              <FiSearch className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={filters.type + filters.category + pagination.page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/items/${item.id}`}
                      className={`card group overflow-hidden hover:shadow-lg transition-shadow ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      {/* Image */}
                      <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={resolveImageUrl(item.images?.[0]?.url)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                item.type === 'lost'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {item.type === 'lost' ? (
                                <FiAlertCircle className="inline mr-1" />
                              ) : (
                                <FiCheckCircle className="inline mr-1" />
                              )}
                              {item.type.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1">
                        <span className="text-xs text-primary-600 font-medium">
                          {item.category}
                        </span>
                        <h3 className="font-semibold text-lg mt-1 group-hover:text-primary-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FiMapPin className="mr-1" />
                            {item.location?.city || 'Unknown'}
                          </span>
                          <span className="flex items-center">
                            <FiClock className="mr-1" />
                            {formatDate(item.date)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiChevronLeft />
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  Math.abs(page - pagination.page) <= 1
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg font-medium ${
                        pagination.page === page
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  (page === pagination.page - 2 && pagination.page > 3) ||
                  (page === pagination.page + 2 && pagination.page < pagination.totalPages - 2)
                ) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ItemsPage;
