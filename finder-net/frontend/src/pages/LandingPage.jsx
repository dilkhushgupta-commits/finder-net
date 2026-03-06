import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiUpload, FiZap, FiShield, FiMessageCircle, FiTrendingUp } from 'react-icons/fi';

const LandingPage = () => {
  const features = [
    {
      icon: <FiZap className="w-8 h-8" />,
      title: 'AI-Powered Matching',
      description: 'Advanced computer vision algorithms match lost and found items instantly'
    },
    {
      icon: <FiUpload className="w-8 h-8" />,
      title: 'Easy Reporting',
      description: 'Upload photos and details of lost or found items in seconds'
    },
    {
      icon: <FiSearch className="w-8 h-8" />,
      title: 'Smart Search',
      description: 'Filter by category, location, date, and visual similarity'
    },
    {
      icon: <FiMessageCircle className="w-8 h-8" />,
      title: 'Secure Chat',
      description: 'Connect with potential matches while maintaining privacy'
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: 'Verified Claims',
      description: 'QR code verification ensures items reach rightful owners'
    },
    {
      icon: <FiTrendingUp className="w-8 h-8" />,
      title: 'High Success Rate',
      description: 'Track recovery statistics and match confidence scores'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Find What's Lost,<br />Return What's Found
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              AI-powered platform connecting lost items with their owners using intelligent image matching
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <button className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-xl">
                  Get Started Free
                </button>
              </Link>
              <Link to="/browse">
                <button className="px-8 py-4 bg-primary-500 text-white rounded-lg font-semibold text-lg hover:bg-primary-400 transition-all duration-200 border-2 border-white/30">
                  Browse Items
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose Finder-Net?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Cutting-edge technology meets compassionate community
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container-custom">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Report Item', desc: 'Upload photo and details' },
              { step: '2', title: 'AI Analysis', desc: 'System analyzes and finds matches' },
              { step: '3', title: 'Get Notified', desc: 'Receive match suggestions' },
              { step: '4', title: 'Recover Item', desc: 'Connect and verify ownership' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Find or Help?</h2>
          <p className="text-xl mb-8">Join thousands recovering lost items every day</p>
          <Link to="/register">
            <button className="px-10 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-xl">
              Start Now
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container-custom text-center">
          <p className="text-lg font-semibold mb-2">Finder-Net</p>
          <p className="text-sm">AI-Powered Lost & Found Management System</p>
          <p className="text-sm mt-4">&copy; 2026 Finder-Net. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
