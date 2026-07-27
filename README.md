# 💊 PharmaTrack – Community Pharmacy Ordering Platform

A cloud-native pharmacy ordering platform developed using **React, Next.js, and Firebase**, enabling customers to browse nearby pharmacies, reserve medicines, manage shopping carts, and place orders while providing administrators with powerful inventory and user management tools.

Built using a serverless architecture, PharmaTrack combines Firebase Authentication, Cloud Firestore, and interactive mapping technologies to deliver a secure, scalable, and responsive healthcare ordering platform.

---

# 📖 Project Overview

PharmaTrack is a modern web application designed to simplify the process of ordering medicines from local pharmacies.

Customers can browse nearby pharmacies, search available medicines, reserve products, manage their shopping cart, and place orders through an intuitive interface. Administrators are provided with comprehensive tools to manage products, inventory, customer accounts, and order processing.

The project demonstrates modern cloud application development using React, Next.js, Firebase Authentication, Cloud Firestore, and Leaflet while following responsive design and secure authentication principles.

---

# ⭐ Project Highlights

- Individual university project
- Cloud-native architecture
- React & Next.js frontend
- Firebase Authentication
- Cloud Firestore database
- Interactive pharmacy map
- Real-time stock synchronisation
- Shopping cart & reservation system
- Role-Based Access Control (RBAC)
- Administrator dashboard
- Responsive user interface

---

# 👨‍💻 My Role

This was an individual university project where I independently designed, developed, tested, and documented the complete application, including frontend development, Firebase integration, authentication, database structure, and administrative functionality.

---

# ✨ Core Features

- Cloud-native pharmacy ordering platform
- Interactive pharmacy map using Leaflet
- Pharmacy-specific medicine catalogue
- Shopping cart with stock reservation
- Secure checkout workflow
- Firebase Authentication
- Role-Based Access Control (RBAC)
- Product and inventory management
- Order management dashboard
- User account administration
- Real-time profile synchronisation
- Responsive user interface

---

# 🛠 Technologies & Tools

| Category | Technologies |
|-----------|--------------|
| Frontend | React, Next.js, TypeScript, HTML5, CSS3 |
| Cloud Services | Firebase Authentication, Firebase Firestore, Firebase Hosting |
| Database | Cloud Firestore (NoSQL) |
| Mapping | Leaflet, OpenStreetMap |
| Development Tools | Visual Studio Code, Git, GitHub, Postman |

---

# 📸 Application Showcase

## 🏥 Customer Experience

### Home Page

![Homepage](./images/homepage.png)

The homepage provides users with quick access to pharmacy locations, authentication, account management, and navigation throughout the application.

---

### Interactive Pharmacy Map

![Pharmacy Map](./images/pharmacy-map.png)

Users can browse pharmacy locations using an interactive Leaflet map integrated with OpenStreetMap. Selecting a pharmacy dynamically loads only the medicines available at that specific branch, improving both performance and user experience.

---

### Product Catalogue

![Products](./images/product-list.png)

Products are filtered according to the selected pharmacy, allowing users to browse available medicines, review stock levels, and add items to their shopping cart.

---

### Shopping Cart & Checkout

<p align="center">
<img src="./images/cart1.png" width="420">
<img src="./images/cart2.png" width="420">
</p>

The reservation system temporarily reserves medicine stock while products remain in the customer's shopping cart, reducing conflicting purchases during checkout.

---

## 👨‍💼 Administrator Dashboard

<p align="center">
<img src="./images/admin-dashboard1.png" width="420">
<img src="./images/admin-dashboard2.png" width="420">
</p>

Administrators can:

- Add new medicines
- Update product information
- Manage stock levels
- Process customer orders
- Manage user accounts
- Disable user accounts when necessary

---

## 👤 User Profile

<p align="center">
<img src="./images/profile-update1.png" width="420">
<img src="./images/profile-update2.png" width="420">
</p>

User profile information is synchronised in real time using Firestore snapshot listeners, ensuring interface updates occur immediately without requiring page refreshes.

---

# ☁️ Cloud Architecture

PharmaTrack follows a fully serverless cloud architecture powered by Firebase services.

The application combines:

- React / Next.js frontend
- Firebase Authentication
- Cloud Firestore database
- Real-time Firestore listeners
- Cloud-hosted user data

This architecture removes the need for a traditional backend server while providing scalability, security, and real-time synchronisation.

---

# 🔄 Application Workflow

```text
Customer

↓

React / Next.js Frontend

↓

Firebase Authentication

↓

Cloud Firestore

↓

Real-Time Data Synchronisation

↓

Updated User Interface
```

---

# 🔐 Firebase Integration

Firebase services are used throughout the application to provide secure authentication and cloud-based data storage.

Firestore stores:

- Users
- Pharmacies
- Products
- Orders
- Reservations

This flexible NoSQL structure allows the application to scale efficiently while maintaining fast query performance.

---

# 🛡 Role-Based Access Control (RBAC)

Authentication is managed using Firebase Authentication while user roles are stored within Firestore.

### Customer

- Browse pharmacies
- Search medicines
- Manage shopping cart
- Place orders
- View order history

### Administrator

- Manage medicines
- Update stock
- Process orders
- Manage users
- Disable user accounts

This separation ensures administrative functionality remains secure while customers can safely access public features.

---

# 🗺 Interactive Pharmacy Map

Leaflet and OpenStreetMap provide an interactive mapping experience that allows users to locate nearby pharmacies.

Rather than loading every medicine across the platform, each pharmacy marker retrieves only the products assigned to that location, improving:

- Performance
- Accuracy
- User experience

---

# 🛒 Shopping Cart & Reservation System

The shopping cart includes a reservation mechanism that temporarily holds medicine stock while users complete the checkout process.

This helps prevent multiple customers from purchasing unavailable medicines simultaneously while demonstrating real-time inventory management.

---

# ⚡ Real-Time Synchronisation

Firestore snapshot listeners allow the application to update interface components automatically whenever data changes.

Real-time synchronisation is used for:

- User profile updates
- Product stock
- Order status
- Administrative changes

This removes the need for manual page refreshes while providing a modern user experience.

---

# 🚧 Challenges & Solutions

During development several technical challenges were encountered and resolved.

### Firestore Permissions

Configured Firestore security rules to separate public product access from protected customer and administrator operations.

### Leaflet Rendering

Resolved React rendering conflicts by correctly managing the Leaflet component lifecycle.

### Administrator Roles

Implemented real-time user listeners to ensure administrator permissions remained synchronised.

### Product Loading

Normalised pharmacy product identifiers to guarantee accurate stock information across pharmacy locations.

---

# 📚 What I Learned

Developing PharmaTrack significantly strengthened my understanding of modern cloud application development.

Key learning outcomes include:

- React component architecture
- Next.js application development
- TypeScript
- Firebase Authentication
- Cloud Firestore
- NoSQL database design
- Real-time synchronisation
- Role-Based Access Control (RBAC)
- Interactive mapping with Leaflet
- Cloud application security
- State management
- Responsive interface development

---

# 🚀 Future Improvements

Future development could include:

- Payment gateway integration
- Firebase Admin SDK backend
- Advanced analytics dashboard
- Push notifications
- Prescription verification workflow
- Order tracking notifications
- Pharmacy reporting dashboard
- Accessibility improvements

---

# 🔑 Test Credentials

Use the following accounts to explore both user roles.

| Role | Email | Password |
|------|--------|----------|
| **Administrator** | `admin@pharm.com` | `admin123` |
| **Customer** | `user@pharm.com` | `user123` |

---

# ⚙ Installation & Setup

## Clone the Repository

```bash
git clone https://github.com/yurihenrique98/PharmaTrack.git
cd PharmaTrack
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Firebase

Create a `.env.local` file and add your Firebase configuration.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Start the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

# 🎯 Conclusion

PharmaTrack demonstrates my ability to design and develop a modern cloud-native web application using React, Next.js, Firebase, and Firestore. The project combines secure authentication, role-based access control, cloud-native architecture, real-time data synchronisation, interactive mapping, inventory management, and responsive interface design to deliver a scalable pharmacy ordering platform built using contemporary software engineering practices.

---

# 👨‍💻 Author

**Yuri Henrique Gomes de Oliveira**

Graduate Software Developer

- GitHub: https://github.com/yurihenrique98
- LinkedIn: https://www.linkedin.com/in/yuri-henrique-gomes-de-oliveira-07a4bb395

---

## ⭐ If you found this project interesting, feel free to star the repository!
