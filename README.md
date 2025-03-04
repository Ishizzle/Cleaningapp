# 🚀 AI-Powered Janitorial Management System

## **Overview**
This project is a **state-of-the-art AI-powered, IoT-integrated janitorial management system** designed to optimize cleaning operations, automate task assignments, and ensure compliance with industry standards like CIMS & ISSA.

Key features include:
✅ **AI-Powered Task Scheduling** – Predictive cleaning assignments based on real-time sensor data.
✅ **IoT-Enabled Facility Monitoring** – Smart sensors detect spills, air quality, and foot traffic.
✅ **Voice-Controlled Task Assignment** – Assign cleaning tasks using voice commands.
✅ **Gig Worker Management System** – AI-driven worker matching for efficient task allocation.
✅ **Holographic UI & AR Training** – Enhanced supervisor monitoring and immersive employee training.
✅ **Secure & Scalable Backend** – Built with Node.js, Express, MongoDB, and MQTT.

---

## **📂 Project Structure**
```
janitorial-backend/
├── models/           # Database models
│   ├── Task.js       # Cleaning task schema
├── routes/           # API routes
│   ├── authRoutes.js # User authentication API
│   ├── taskRoutes.js # Task management API
│   ├── reportRoutes.js # Incident reporting API
├── middleware/       # Middleware functions
│   ├── authMiddleware.js # JWT authentication
├── config/           # Configuration files
│   ├── db.js         # MongoDB connection setup
├── server.js         # Main backend server
├── .env              # Environment variables
├── README.md         # Project documentation
└── package.json      # Node.js dependencies
```

---

## **🛠️ Tech Stack**
### **Backend:**
- **Node.js + Express.js** – Scalable API framework.
- **MongoDB Atlas** – Cloud-based NoSQL database.
- **MQTT Protocol** – IoT real-time sensor data processing.
- **Python (AI Model Processing)** – AI-based task scheduling.
- **JWT Authentication** – Secure user login and role management.

### **Frontend (Planned Future Expansion):**
- **React.js (AdminLTE UI Dashboard)**
- **React Native (Gig Worker Mobile App)**
- **Three.js (Holographic UI)**

### **AI & IoT Integrations:**
- **TensorFlow/PyTorch** – AI model for task optimization.
- **OpenCV + YOLO** – AI-based real-time spill & cleanliness detection.
- **Google AutoML Vision** – Image-based cleanliness assessment.
- **Smart IoT Sensors (Raspberry Pi, ESP32)** – Monitor air quality, occupancy, and sanitation levels.

---

## **⚙️ Installation & Setup**
### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/your-repo/janitorial-backend.git
cd janitorial-backend
```

### **2️⃣ Install Dependencies**
```bash
npm install
```

### **3️⃣ Set Up Environment Variables**
Create a `.env` file and configure:
```
MONGO_URI=your_mongodb_connection_string
MQTT_BROKER_URL=your_mqtt_broker_url
PORT=5000
```

### **4️⃣ Run the Backend**
```bash
node server.js
```
✅ **Expected Output:**
```
✅ MongoDB Connected
✅ Connected to MQTT Broker
🚀 Server running on port 5000
```

---

## **📡 API Endpoints**
### **🔹 User Authentication**
| Method | Endpoint | Description |
|--------|-------------|-------------|
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login` | User login & JWT token issuance |

### **🔹 Cleaning Task Management**
| Method | Endpoint | Description |
|--------|-------------|-------------|
| GET    | `/api/tasks` | Get all tasks |
| POST   | `/api/tasks` | Create a new task |
| PUT    | `/api/tasks/:id` | Update task status |
| DELETE | `/api/tasks/:id` | Delete a task |

### **🔹 IoT & AI Task Scheduling**
| Method | Endpoint | Description |
|--------|-------------|-------------|
| POST   | `/api/voice-assistant/task` | Assign task via voice command |
| POST   | `/api/sensors/data` | Receive IoT sensor data & trigger AI |

---

## **🧪 Testing the API**
1. Use **Postman** or **cURL** to test API requests.
2. Run a **POST request** to create a new cleaning task:
```json
POST /api/tasks
{
  "taskType": "Restroom Sanitization",
  "location": "Building A - Floor 3",
  "priority": "High"
}
```
3. ✅ **Expected Response:**
```json
{
  "message": "Task Created Successfully",
  "task": { "taskType": "Restroom Sanitization", "status": "Pending" }
}
```

---

## **🚀 Deployment on Replit**
1. **Create a new Replit project** with **Node.js**.
2. **Upload backend files** to Replit.
3. **Install dependencies:**
```bash
npm install
```
4. **Start the server:**
```bash
node server.js
```

---

## **📅 Roadmap & Next Steps**
- [ ] **Integrate AI-powered task prioritization.**
- [ ] **Expand IoT sensor integration.**
- [ ] **Develop a React-based AdminLTE dashboard.**
- [ ] **Deploy a gig-worker mobile app for cleaners.**
- [ ] **Optimize real-time analytics & reporting.**

---

## **🛡️ Security & Compliance**
✅ **Role-Based Access Control (RBAC)** to ensure only authorized users access critical features.  
✅ **JWT Authentication** for secure API requests.  
✅ **GDPR & CIMS Compliance** for industry standards in janitorial management.  
✅ **Data Encryption** for sensitive user and operational data.

---

## **👨‍💻 Contributors**
- **Your Name** - Project Lead  
- **Other Team Members** - AI, IoT, and Backend Engineers  

---

## **📩 Contact & Support**
For questions, issues, or feature requests, contact **[your-email@example.com](mailto:your-email@example.com)** or open a GitHub issue.

🚀 **Let’s build the future of janitorial automation!** 🔥

