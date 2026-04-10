# 🌾 Farm-to-Market Crop Tracking System (Web-Based)

A **web-based crop traceability system** that connects farmers, transporters, warehouses, intermediaries, and retailers on a unified digital platform.

## 🌐 Project Type

💻 **Platform**: Web Application
📦 **Domain**: AgriTech / Supply Chain
🏆 **Context**: Hackathon Project

---

## 🚀 Key Features

* 👥 Stakeholder registration & verified profiles
* 🏷️ QR/RFID-based crop batch tracking
* 🗄️ Centralized database for traceability
* 📍 Real-time location tracking
* 📱 QR scan for consumer transparency
* 📊 Analytics dashboard
* 📑 Automated compliance reporting (EUDR)

---

## 🧑‍🤝‍🧑 Team Members

> Replace with your actual team details:

* Member 1 – Frontend Developer
* Member 2 – Backend Developer
* Member 3 – Database Engineer
* Member 4 – IoT Integration
* Member 5 – UI/UX Designer

---

## 🏗️ System Architecture Overview

1. **Frontend (Web App)** – User interface for all stakeholders
2. **Backend Server** – Handles APIs, authentication, and logic
3. **Database** – Stores all tracking and user data
4. **IoT Integration** – Sensors send real-time environmental data
5. **QR System** – Enables easy tracking and verification

---

## ⚙️ Step-by-Step System Workflow

### 1️⃣ Stakeholder Registration

* All stakeholders register on the website:

  * Farmers
  * Transporters
  * Warehouses
  * Intermediaries
  * Retailers
* Profiles are verified by the system
* Unique IDs assigned to each user

---

### 2️⃣ Crop Batch Creation

* Farmer logs into the web dashboard
* Creates a new crop batch
* System generates:

  * **QR code or RFID tag**
* Tag is linked to the database record

---

### 3️⃣ Initial Data Entry

* Farmer enters:

  * Crop type
  * Planting date
  * Harvest date
  * Farm location
  * Farmer details
* Data is stored in the centralized database

---

### 4️⃣ IoT Sensor Integration

* Sensors installed in:

  * Storage units
  * Transport vehicles
* Automatically track:

  * Temperature
  * Humidity
  * GPS location
* Data is sent to backend via APIs and displayed on dashboard

---

### 5️⃣ Supply Chain Tracking

* Each stakeholder updates batch status:

  * Collection
  * Warehousing
  * Transportation
  * Retail
* Each update includes:

  * Timestamp
  * Location
  * Condition data

---

### 6️⃣ Data Logging & Traceability

* All updates stored securely in database
* Maintains full history of product journey
* Enables quick retrieval and reporting

---

### 7️⃣ Consumer Verification

* QR code scanned via smartphone browser
* Displays:

  * Full product journey
  * Handling conditions
  * Quality details

---

### 8️⃣ Compliance Reporting

* System extracts traceability data
* Automatically generates reports for:

  * **EUDR (EU Deforestation Regulation)**
* Export options: PDF / CSV

---

### 9️⃣ Analytics Dashboard

* Provides insights such as:

  * Supply chain efficiency
  * Loss tracking
  * Delivery performance
  * Environmental condition trends

---

## 🛠️ Tech Stack (Without Blockchain)

* **Frontend**: React.js / HTML / CSS / JavaScript
* **Backend**: Node.js / Express.js
* **Database**: MongoDB / PostgreSQL
* **IoT Integration**: REST APIs / MQTT
* **QR Code**: QR generation libraries (e.g., qrcode.js)
* **Hosting**: Vercel / Netlify / AWS

---

## 📦 Installation & Setup

```bash id="setup45678"
# Clone the repository
git clone https://github.com/your-username/farm-tracking-system.git

# Navigate to project directory
cd farm-tracking-system

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔥 Firebase Realtime Database Setup

The protected dashboard now fetches live records from Firebase Realtime Database:

1. Create a Realtime Database in your Firebase project (start in test mode for development).
2. Confirm your Realtime Database URL in [localdev-config.json](localdev-config.json) and the Firebase setup inside `app.js`.
3. Set Firebase Realtime Database rules for development:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

1. Start the app and login with IBM App ID.
2. Open `/protected/protected.html` to view live crop updates fetched from Realtime Database.

Before production, lock down rules to authenticated users only.

## ☁️ Render Deployment (IBM App ID Fix)

If login redirects to `/error` after deployment, your callback is still using localhost.

Set one of these environment variables in Render:

* `APP_BASE_URL=https://your-service-name.onrender.com`
* or `PUBLIC_URL=https://your-service-name.onrender.com`

The server automatically builds App ID callback as:

* `https://your-service-name.onrender.com/ibm/cloud/appid/callback`

Also add the same callback URL in IBM App ID allowed redirect URLs.

## 🐳 Render Deployment with Docker

Use these settings in Render when deploying from the Dockerfile:

1. Create a new **Web Service** and choose **Docker** as the environment.
2. Connect the GitHub repository.
3. Leave the Dockerfile path as `Dockerfile`.
4. Set environment variables:
   * `APP_BASE_URL=https://your-service-name.onrender.com`
   * `NODE_ENV=production`
5. Make sure IBM App ID allows this redirect URL:
   * `https://your-service-name.onrender.com/ibm/cloud/appid/callback`
6. Deploy and open the Render URL.

If the app still shows Authentication Error, open Render logs and confirm the startup line prints the resolved App ID redirect URI.

---

## 🌍 How to Use

1. Open the web app in your browser
2. Register/Login as a stakeholder
3. Farmers create crop batches
4. Track movement across supply chain
5. Update status at each stage
6. Scan QR codes to verify product journey
7. Use dashboard for insights

---

## 🎯 Problem Solved

* ❌ Lack of transparency in supply chains
* ❌ Manual record keeping
* ❌ High post-harvest losses
* ❌ Difficult compliance processes

✅ This system provides a **simple, scalable, and practical digital solution**

---

## 🔮 Future Enhancements

* AI-based spoilage prediction
* Mobile app version
* Offline support for rural areas
* SMS alerts for farmers
* Integration with government systems

---

## 📜 License

This project is developed for a hackathon and can be extended further.

---

## 🙌 Acknowledgements

* Hackathon organizers
* Open-source community
* Team collaboration

---

## ⭐ Contributing

Pull requests are welcome! Feel free to improve features, UI, or performance.

---
