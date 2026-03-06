/**
 * QR Code Generator Utility
 * Generate QR codes for item verification
 */

const QRCode = require('qrcode');

/**
 * Generate QR code for item verification
 * @param {String} itemId - Item ID
 * @param {String} verificationCode - Verification code
 * @returns {String} QR code data URL
 */
const generateItemQRCode = async (itemId, verificationCode) => {
  try {
    const data = JSON.stringify({
      itemId,
      verificationCode,
      timestamp: new Date().toISOString()
    });

    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate verification code
 * @returns {String} 6-digit verification code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Verify QR code data
 * @param {String} qrData - QR code data
 * @returns {Object} Parsed data
 */
const verifyQRCode = (qrData) => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    throw new Error('Invalid QR code data');
  }
};

module.exports = {
  generateItemQRCode,
  generateVerificationCode,
  verifyQRCode
};
