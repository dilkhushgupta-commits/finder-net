# 🔍 Finder-Net – AI-Powered Lost & Found Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)

A modern, intelligent lost-and-found management platform that leverages **artificial intelligence** and **computer vision** to match lost items with found items automatically. Built with cutting-edge technologies to provide real-time item recovery assistance.

---

## 🎯 Project Overview

Finder-Net replaces traditional manual lost-and-found systems with an AI-driven platform capable of:
- **Intelligent Image Matching** using deep learning (ResNet50)
- **Real-time Communication** via Socket.IO
- **Secure Authentication** with JWT
- **Admin Moderation** for content verification
- **QR Code Verification** for secure item claims
- **Mobile-Responsive Design** with Tailwind CSS

---

## 🏗️ System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   React.js      │◄────►│  Node.js/Express│◄────►│  MongoDB Atlas  │
│   Frontend      │      │   Backend API   │      │    Database     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Python FastAPI │
                         │  AI Service     │
                         │  (ResNet50 CNN) │
                         └─────────────────┘
```

---

## 🚀 Tech Stack

### **Frontend**
- ⚛️ React.js 18.2 - Component-based UI
- 🎨 Tailwind CSS - Utility-first styling
- 🔀 React Router - Client-side routing
- 📦 Axios - HTTP client
- 🎭 Framer Motion - Animations
- 🔌 Socket.IO Client - Real-time chat

### **Backend**
- 🟢 Node.js & Express.js - REST API
- 🔐 JWT - Authentication
- 🗄️ MongoDB & Mongoose - Database
- 🔒 bcryptjs - Password hashing
- ☁️ Cloudinary - Image storage
- 📧 Nodemailer - Email notifications
- 🔌 Socket.IO - WebSocket server

### **AI Service**
- 🐍 Python 3.10+ & FastAPI
- 🧠 PyTorch & torchvision
- 🖼️ OpenCV - Image processing
- 🎯 ResNet50 - Feature extraction
- 📊 scikit-learn - Similarity matching
- 🗄️ PyMongo - Database connector

---

## 📁 Project Structure

```
finder-net/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── utils/          # Helper functions
│   │   ├── config/         # Configuration files
│   │   ├── socket/         # Socket.IO handlers
│   │   └── server.js       # Entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/               # React.js Application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (Auth, Theme)
│   │   ├── services/      # API services
│   │   ├── utils/         # Helper functions
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── ai-service/            # Python AI Microservice
│   ├── main.py           # FastAPI application
│   ├── feature_extractor.py  # CNN feature extraction
│   ├── similarity_matcher.py # Cosine similarity
│   ├── database.py       # MongoDB operations
│   └── requirements.txt
│
├── docker-compose.yml    # Docker orchestration
└── README.md            # This file
```

---

## ⚡ Quick Start

### **Prerequisites**
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Cloudinary account (for images)

### **1. Clone Repository**
```bash
git clone <your-repo-url>
cd finder-net
```

### **2. Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### **3. Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

### **4. Setup AI Service**
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with MongoDB URI
python main.py
```

### **5. Access Application**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- AI Service: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finder-net
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### AI Service (.env)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finder-net
PORT=8000
SIMILARITY_THRESHOLD=0.7
```

---

## 📡 API Documentation

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### **Items**
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `PUT /api/items/:id/recover` - Mark as recovered

### **AI Matching**
- `POST /api/match/:id` - Find AI matches for item
- `GET /api/match/:id/matches` - Get all matches
- `POST /api/match/report` - Manually report match

### **Chat**
- `GET /api/chat` - Get all user chats
- `GET /api/chat/:id` - Get chat by ID
- `POST /api/chat` - Create new chat
- `POST /api/chat/:id/message` - Send message

### **Admin**
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/items/pending` - Pending items
- `PUT /api/admin/items/:id/approve` - Approve item
- `PUT /api/admin/items/:id/reject` - Reject item

---

## 🎨 Key Features

### 1. **User Authentication**
- Secure JWT-based authentication
- Password hashing with bcrypt
- Email verification
- Password reset functionality

### 2. **Item Reporting**
- Upload multiple images
- Categorize items (15+ categories)
- Location-based search
- Date and time tracking

### 3. **AI Image Matching**
```python
# How it works:
1. User uploads item image
2. ResNet50 extracts 2048-dim feature vector
3. Cosine similarity compares with database
4. Returns top matches with confidence scores
```

### 4. **Real-time Chat**
- Socket.IO powered messaging
- Typing indicators
- Read receipts
- Privacy-preserving (no direct contact info)

### 5. **Admin Dashboard**
- Item approval/rejection
- User management
- Analytics and statistics
- Content moderation

### 6. **QR Code Verification**
- Generate unique QR codes for items
- Scan to verify ownership
- Prevent fraudulent claims

---

## 🔬 AI Matching Algorithm

```
Input: Lost Item Image
↓
[ResNet50 CNN]
↓
Feature Vector (2048 dimensions)
↓
[Cosine Similarity]
↓
Compare with Found Items Database
↓
Return Matches (score > 0.7)
↓
Sorted by Confidence (High/Medium/Low)
```

**Confidence Levels:**
- High: > 0.9 similarity
- Medium: 0.7 - 0.9
- Low: 0.5 - 0.7

---

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  itemsReported: Number,
  itemsRecovered: Number,
  reputation: Number,
  createdAt: Date
}
```

### Items Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  type: String (lost/found),
  status: String (pending/approved/matched/recovered),
  images: [{url, publicId}],
  location: {address, city, coordinates},
  date: Date,
  uploadedBy: ObjectId (ref: User),
  aiFeatureVector: [Number] (2048 dims),
  matches: [{itemId, similarityScore}],
  qrCode: String,
  verificationCode: String
}
```

---

## 🚢 Deployment

### **Vercel (Frontend)**
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### **Render/Railway (Backend)**
```bash
# Push to GitHub
# Connect repository to Render/Railway
# Set environment variables
# Deploy automatically
```

### **PythonAnywhere/Heroku (AI Service)**
```bash
# Deploy using Docker or direct Python deployment
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# AI service tests
cd ai-service
pytest
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**
- Final Year Computer Science Project
- University Name
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- ResNet50 model from PyTorch
- MongoDB Atlas for cloud database
- Cloudinary for image hosting
- OpenAI for inspiration

---

## 📞 Support

For issues and questions:
- 📧 Email: support@findernet.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: [Documentation](https://docs.findernet.com)

---

## 🎓 Academic Use

This project is suitable for:
- Final year computer science projects
- Machine learning demonstrations
- Full-stack development portfolios
- AI/CV research papers

**Citation:**
```
Finder-Net: AI-Powered Lost & Found Management System
[Your Name], [Year]
[University Name]
```

---

<div align="center">

**Made with ❤️ for a better world where nothing stays lost**

⭐ Star this repo if you found it helpful!

</div>
