import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { itemService } from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import {
  FiSearch,
  FiMapPin,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiPlus,
  FiX,
  FiSliders,
  FiEye,
  FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { label: 'All', value: 'All', emoji: '🔍' },
  { label: 'Mobile Phones', value: 'Mobile Phones', emoji: '📱' },
  { label: 'Laptops', value: 'Laptops', emoji: '💻' },
  { label: 'Electronics', value: 'Electronics', emoji: '🔌' },
  { label: 'Wallets', value: 'Wallets', emoji: '👛' },
  { label: 'Keys', value: 'Keys', emoji: '🔑' },
  { label: 'Documents', value: 'Documents', emoji: '📄' },
  { label: 'Bags', value: 'Bags', emoji: '👜' },
  { label: 'Jewelry', value: 'Jewelry', emoji: '💍' },
  { label: 'Watches', value: 'Watches', emoji: '⌚' },
  { label: 'Clothing', value: 'Clothing', emoji: '👕' },
  { label: 'Accessories', value: 'Accessories', emoji: '🎒' },
  { label: 'Pets', value: 'Pets', emoji: '🐾' },
  { label: 'Sports Equipment', value: 'Sports Equipment', emoji: '⚽' },
  { label: 'Books', value: 'Books', emoji: '📚' },
  { label: 'Other', value: 'Other', emoji: '📦' },
];

const BrowseItemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [showCityInput, setShowCityInput] = useState(!!searchParams.get('city'));

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const page = parseInt(searchParams.get('page')) || 1;
      const params = {
        page,
        limit: 16,
        status: 'approved'
      };

      const currentSearch = searchParams.get('search');
      const currentCategory = searchParams.get('category');
      const currentCity = searchParams.get('city');
      const currentType = searchParams.get('type');

      if (currentSearch) params.search = currentSearch;
      if (currentCategory && currentCategory !== 'All') params.category = currentCategory;
      if (currentCity) params.city = currentCity;
      if (currentType && currentType !== 'all') params.type = currentType;

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
  }, [searchParams]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'All' && value !== 'all') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateSearchParams({ search });
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    updateSearchParams({ category });
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    updateSearchParams({ type });
  };

  const handleCitySubmit = (e) => {
    e.preventDefault();
    updateSearchParams({ city });
  };

  const clearCity = () => {
    setCity('');
    setShowCityInput(false);
    updateSearchParams({ city: '' });
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const hasActiveFilters = selectedCategory !== 'All' || search || city || selectedType !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-20">
      {/* Hero / Search Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 pt-8 pb-12 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6 rounded-b-3xl shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Browse Items
              </h1>
              <p className="text-primary-100 mt-1">
                Help reunite people with their belongings
              </p>
            </div>
            <Link
              to="/report-found"
              className="hidden md:flex items-center gap-2 bg-white text-primary-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-50 transition-all shadow-md hover:shadow-lg"
            >
              <FiPlus className="w-5 h-5" />
              Report Found Item
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative mt-6">
            <div className="flex bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex-1 flex items-center">
                <FiSearch className="ml-4 text-gray-400 w-5 h-5 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search lost items... e.g. iPhone, wallet, keys"
                  className="w-full px-4 py-4 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none text-lg"
                />
              </div>

              {/* City Toggle */}
              {!showCityInput ? (
                <button
                  type="button"
                  onClick={() => setShowCityInput(true)}
                  className="hidden sm:flex items-center gap-1 px-4 text-gray-500 hover:text-primary-600 transition-colors border-l dark:border-gray-700"
                >
                  <FiMapPin className="w-4 h-4" />
                  <span className="text-sm">Location</span>
                </button>
              ) : (
                <div className="flex items-center border-l dark:border-gray-700">
                  <FiMapPin className="ml-3 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onBlur={() => { if (!city) setShowCityInput(false); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCitySubmit(e); } }}
                    placeholder="City..."
                    autoFocus
                    className="w-28 px-2 py-4 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none text-sm"
                  />
                  {city && (
                    <button type="button" onClick={clearCity} className="p-1 mr-1 text-gray-400 hover:text-red-500">
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="px-6 md:px-8 bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Type Filter Tabs */}
        <div className="mb-4 flex gap-2">
          {[{ label: 'All Items', value: 'all' }, { label: 'Lost', value: 'lost' }, { label: 'Found', value: 'found' }].map((t) => (
            <button
              key={t.value}
              onClick={() => handleTypeSelect(t.value)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedType === t.value
                  ? t.value === 'lost' ? 'bg-red-500 text-white shadow-md' : t.value === 'found' ? 'bg-green-500 text-white shadow-md' : 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategorySelect(cat.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters / Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span> items
            {selectedCategory !== 'All' && (
              <span> in <span className="font-medium">{selectedCategory}</span></span>
            )}
            {city && (
              <span> near <span className="font-medium">{city}</span></span>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedType('all');
                setCity('');
                setShowCityInput(false);
                setSearchParams({});
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <FiX className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse shadow-sm">
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No items found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'No items have been reported yet. Be the first to report a found item!'}
            </p>
            <div className="flex gap-3 justify-center">
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                    setSelectedType('all');
                    setCity('');
                    setShowCityInput(false);
                    setSearchParams({});
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              )}
              <Link to="/report-found" className="btn-primary inline-flex items-center gap-2">
                <FiPlus className="w-4 h-4" /> Report Found Item
              </Link>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory + search + city + pagination.page}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    to={`/items/${item.id}`}
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block border border-gray-100 dark:border-gray-700"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={resolveImageUrl(item.images?.[0]?.url)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className={`${item.type === 'lost' ? 'bg-red-500/90' : 'bg-green-500/90'} backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1`}>
                          <FiAlertCircle className="w-3 h-3" />
                          {item.type?.toUpperCase()}
                        </span>
                      </div>

                      {/* Image count badge */}
                      {item.images?.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-[11px] font-medium flex items-center gap-1">
                          <FiEye className="w-3 h-3" />
                          {item.images.length}
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-1.5">
                      {/* Category Tag */}
                      <span className="inline-block text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>

                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700">
                        <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <FiMapPin className="mr-1 w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[80px]">{item.location?.city || 'Unknown'}</span>
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(item.date || item.created_at)}
                        </span>
                      </div>

                      {/* Reporter name */}
                      {item.users && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <div className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-bold text-primary-600 dark:text-primary-300">
                              {item.users.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {item.users.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="flex gap-1">
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
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                        pagination.page === page
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  (page === pagination.page - 2 && pagination.page > 3) ||
                  (page === pagination.page + 2 && pagination.page < pagination.totalPages - 2)
                ) {
                  return <span key={page} className="px-1 text-gray-400 self-end">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Floating Report Found Item Button (Mobile) */}
      <Link
        to="/report-found"
        className="md:hidden fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white w-14 h-14 rounded-2xl shadow-xl shadow-primary-300 dark:shadow-primary-900 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Report Found Item"
      >
        <FiPlus className="w-6 h-6" />
      </Link>

      {/* Desktop Sticky Bottom Bar */}
      <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Link
          to="/report-found"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl shadow-xl shadow-primary-300/50 dark:shadow-primary-900/50 font-semibold transition-all hover:scale-105 hover:shadow-2xl"
        >
          <FiPlus className="w-5 h-5" />
          Found Something? Report It!
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default BrowseItemsPage;
