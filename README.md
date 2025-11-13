# SmartWaste - Waste Management System

A comprehensive digital waste management system that connects residents, waste collectors, and administrators through a modern web application.

## 🚀 Features

### For Residents
- **Easy Pickup Scheduling**: Schedule waste pickups with interactive map selection
- **Real-time Tracking**: Track your pickup status and collector location
- **Points & Rewards**: Earn points for waste disposal and redeem rewards
- **Tier System**: Progress through Bronze, Silver, and Gold tiers
- **Profile Management**: Update personal information and preferences

### For Collectors
- **Pickup Management**: View and accept available pickup requests
- **GPS Navigation**: Real-time location tracking and route optimization
- **Performance Analytics**: Track completion rates and earnings
- **Schedule Management**: Organize daily pickup schedules
- **Earnings Tracking**: Monitor weekly and monthly earnings

### For Administrators
- **User Management**: Manage residents, collectors, and system settings
- **Analytics Dashboard**: Comprehensive system analytics and reporting
- **Pickup Oversight**: Monitor all pickup requests and their status
- **System Configuration**: Configure points system and rewards
- **Performance Monitoring**: Track collector and system performance

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **bcryptjs** for password hashing

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Bootstrap 5** for responsive design
- **Leaflet.js** for interactive maps
- **Chart.js** for data visualization
- **Bootstrap Icons** for UI icons

### Security
- **Helmet.js** for security headers
- **CORS** for cross-origin requests
- **Rate limiting** for API protection
- **Input validation** and sanitization

## 📁 Project Structure

```
smartwaste-system/
├── config/
│   ├── db.js              # Database configuration
│   ├── constants.js       # System constants
│   └── socket.js          # Socket.io configuration
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── roleAuth.js        # Role-based authorization
│   └── validation.js      # Input validation
├── models/
│   ├── User.js            # User model with roles
│   ├── PickupRequest.js   # Pickup request model
│   ├── Reward.js          # Reward system model
│   ├── Redemption.js      # Reward redemption model
│   └── SystemConfig.js    # System configuration model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── pickups.js         # Pickup management routes
│   ├── collectors.js      # Collector-specific routes
│   ├── rewards.js         # Reward system routes
│   ├── admin.js           # Admin management routes
│   └── analytics.js       # Analytics and reporting routes
├── public/
│   ├── css/
│   │   └── styles.css     # Custom styles
│   ├── js/
│   │   ├── api-service.js         # API service layer
│   │   ├── notification-service.js # Email/SMS notifications
│   │   ├── realtime.js            # Real-time communication
│   │   ├── map.js                 # Map functionality
│   │   └── dashboard-user.js      # User dashboard logic
│   ├── dashboard-user.html        # User dashboard
│   ├── dashboard-collector.html   # Collector dashboard
│   ├── dashboard-admin.html       # Admin dashboard
│   ├── login.html                 # Login page
│   ├── register.html              # Registration page
│   └── test-integration.html      # Integration tests
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartwaste-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smartwaste
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## 📱 Usage

### For Residents
1. **Register** an account or **login** with existing credentials
2. **Schedule a pickup** by selecting waste type, location on map, and preferred time
3. **Track your pickup** in real-time as collector is assigned and en route
4. **Earn points** for completed pickups and **redeem rewards**
5. **View your history** and **manage your profile**

### For Collectors
1. **Login** to the collector dashboard
2. **View available pickups** and accept those in your service area
3. **Navigate to pickup locations** using GPS integration
4. **Update pickup status** (accepted → in progress → completed)
5. **Track your performance** and earnings

### For Administrators
1. **Access admin dashboard** with administrative privileges
2. **Manage users** (residents and collectors)
3. **Monitor system performance** through analytics
4. **Configure system settings** including points and rewards
5. **Oversee pickup operations** and resolve issues

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Pickups
- `POST /api/pickups` - Create pickup request
- `GET /api/pickups/my-pickups` - Get user's pickups
- `GET /api/pickups/available` - Get available pickups (collectors)
- `PATCH /api/pickups/:id/accept` - Accept pickup (collectors)
- `PATCH /api/pickups/:id/complete` - Complete pickup (collectors)

### Rewards
- `GET /api/rewards` - Get available rewards
- `POST /api/rewards/redeem` - Redeem reward
- `GET /api/rewards/my-redemptions` - Get redemption history

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - User management
- `GET /api/admin/pickups` - Pickup management
- `GET /api/analytics/overview` - System analytics

## 🧪 Testing

### Integration Tests
Run the integration test suite by opening `http://localhost:5000/test-integration.html` in your browser. This will test:
- API service functionality
- Notification system
- Map integration
- Real-time communication

### Manual Testing
1. **User Registration & Login**: Test account creation and authentication
2. **Pickup Scheduling**: Test the complete pickup request flow
3. **Collector Workflow**: Test pickup acceptance and completion
4. **Admin Functions**: Test user management and analytics
5. **Real-time Updates**: Test live status updates and notifications

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access Control**: Different access levels for users
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Rate Limiting**: Protection against API abuse

## 📊 Database Schema

### User Model
- Basic info (name, email, phone, password)
- Role (resident, collector, admin)
- Points and tier system
- Role-specific data (location, vehicle, stats)

### PickupRequest Model
- Waste details (type, size, description)
- Location (coordinates, address)
- Status tracking (pending, accepted, completed)
- Points calculation and assignment

### Reward Model
- Reward details (name, description, points cost)
- Stock management and redemption limits
- Tier requirements and categories

## 🚀 Deployment

### Production Deployment
1. **Set up production environment variables**
2. **Configure MongoDB Atlas** or production MongoDB instance
3. **Set up reverse proxy** (nginx recommended)
4. **Enable HTTPS** with SSL certificates
5. **Configure domain** and DNS settings
6. **Set up monitoring** and logging

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- OpenStreetMap for map data
- Bootstrap for UI components
- Leaflet.js for interactive maps
- MongoDB for database
- Express.js community for excellent documentation

## 📞 Support

For support, email support@smartwaste.com or create an issue in the repository.

---

**SmartWaste** - Making waste management smart, efficient, and rewarding! 🌱♻️
