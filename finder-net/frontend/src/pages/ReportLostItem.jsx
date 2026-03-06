import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { itemService } from '../services/api';
import {
  FiUpload,
  FiX,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiInfo,
  FiPhone,
  FiMail
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATEGORIES = [
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

const ReportLostItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: 'India'
    },
    contactEmail: '',
    contactPhone: ''
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('type', 'lost');
      data.append('date', formData.date);
      data.append('time', formData.time || '');
      data.append('location', JSON.stringify(formData.location));
      data.append('contactEmail', formData.contactEmail || '');
      data.append('contactPhone', formData.contactPhone || '');

      images.forEach(image => {
        data.append('images', image);
      });

      await itemService.createItem(data);

      toast.success('Lost item reported successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error reporting item:', error);
      toast.error(error.response?.data?.message || 'Failed to report item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Report Lost Item</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fill in the details to help us find your lost item
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiUpload className="mr-2" /> Upload Images
            </h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }`}
            >
              <input {...getInputProps()} />
              <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-primary-600">Drop the images here...</p>
              ) : (
                <>
                  <p className="text-lg mb-2">Drag & drop images here</p>
                  <p className="text-sm text-gray-500">or click to select files</p>
                  <p className="text-xs text-gray-400 mt-2">Max 5 images, 5MB each</p>
                </>
              )}
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {images.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={file.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiInfo className="mr-2" /> Item Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Item Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Blue iPhone 14 Pro"
                  required
                  minLength={3}
                  maxLength={100}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input min-h-[120px]"
                  placeholder="Provide detailed description including color, brand, unique marks..."
                  required
                  minLength={10}
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <FiCalendar className="inline mr-2" />
                  Date Lost *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <FiClock className="inline mr-2" />
                  Approximate Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiMapPin className="mr-2" /> Location Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address/Area *</label>
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Central Mall, MG Road"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Mumbai"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Maharashtra"
                />
              </div>
            </div>
          </div>

          {/* Contact (Optional) */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiPhone className="mr-2" /> Contact Details (Optional)
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Provide contact details for direct communication (only visible to matched users)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FiMail className="inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="input"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <FiPhone className="inline mr-2" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="input"
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2"></span>
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReportLostItem;
