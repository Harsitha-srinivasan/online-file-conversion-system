# Online File Conversion System (Antigravity)

A full-stack MERN web application that allows users to upload files and convert them into different formats securely and efficiently.

---

##  Features

* User authentication (JWT based login & register)
* Upload files of multiple formats
* Convert files into target formats
* Download converted files
* View conversion history
* Secure API with protected routes

---

## 🛠 Tech Stack

**Frontend**

* React.js
* Context API
* Axios
* CSS

**Backend**

* Node.js
* Express.js
* REST API

**Database**

* MongoDB Atlas

**Other Tools**

* Multer (file upload)
* JWT Authentication
* Git & GitHub

---

##  Project Structure

```
project-root
│
├── client        # React frontend
├── server        # Node backend
├── .env          # Environment variables
└── README.md
```

---

##  Installation & Setup

### 1. Clone Repository

```
git clone https://github.com/YOUR-USERNAME/online-file-conversion-system.git
cd online-file-conversion-system
```

### 2. Backend Setup

```
cd server
npm install
npm start
```

### 3. Frontend Setup

Open new terminal

```
cd client
npm install
npm start
```

---

##  Environment Variables

Create `.env` inside server folder:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

##  Usage Flow

1. Register/Login
2. Upload file
3. Select conversion format
4. Download converted file
5. Check history

## 📄 License

This project is developed for academic purposes.
# online-file-conversion-system
A full-stack MERN application for converting files between multiple formats.
