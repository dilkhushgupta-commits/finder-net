import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { resolveImageUrl } from '../utils/imageUrl';

const ItemCard = ({ item, className = '' }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Link
      to={`/items/${item.id}`}
      className={`card group overflow-hidden hover:shadow-lg transition-shadow ${className}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={resolveImageUrl(item.images?.[0]?.url)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${
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

        {/* Match Score Badge (if available) */}
        {item.score && (
          <div className="absolute top-2 right-2">
            <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
              {Math.round(item.score * 100)}% Match
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs text-primary-600 font-medium">
          {item.category}
        </span>
        <h3 className="font-semibold text-lg mt-1 group-hover:text-primary-600 transition-colors line-clamp-1">
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
  );
};

export default ItemCard;
