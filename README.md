# 📚 Lend-A-Spartan

A secure and user-friendly **web-based lending system** designed exclusively for **Batangas State University students**.  
Lend-A-Spartan enables students to conveniently **borrow and lend everyday school essentials** (calculators, chargers, umbrellas, etc.) with accountability, safety, and trust.

🔗 **Live Demo:** [https://lend-a-spartan.vercel.app/](https://lend-a-spartan.vercel.app/)  
🧪 **Demo Account:**  
- Email: `admin@g.batstate-u.edu.ph`  
- Password: `admin123`

---

## 🚩 Problem Statement
Students at Batangas State University often forget or lack everyday school essentials.  
Currently, borrowing items is **informal and unsafe**, with no record of exchanges.  

**Lend-A-Spartan** solves this by providing a **campus-exclusive platform** where students can:
- Quickly locate items they need
- Borrow and return with accountability
- Ensure safe and recorded exchanges

---

## 🎯 Objectives

### General Objective
Develop a secure and user-friendly web-based lending system for Batangas State University students.

### Specific Objectives
- ✅ Create a **GSuite-gated web platform** restricted to BatStateU students  
- ✅ Enable fast and safe borrowing/lending of everyday items  
- ✅ Integrate a **rating and feedback system** to promote trust  
- ✅ Provide an **administrative dashboard** to monitor activities, manage reports, and maintain platform integrity  

---

## ⚙️ Core Features

### 🔐 Authentication
- BatStateU student-only sign-in (`@g.batstate-u.edu.ph`)
- Email verification
- Basic profile setup (name, year, campus)

### ⭐ User Reputation
- Profile statistics: completed lend/borrow transactions
- 1–5 star ratings + short feedback after each transaction

### 🔎 Item Search
- Category search (Electronics, School Supplies, Laboratory Supplies, etc.)
- Filter search (campus, availability window, deposit required, condition)

### 📦 Item Listing (Lender)
- Add/edit items (title, image, description, quantity, availability)

### 📝 Borrower Request
- Request form with time/date + short message
- Lender accepts/denies request
- Notifications for both parties

### 📅 Scheduling
- Schedule meetups for item exchange

### 📲 QR Code Verification
- QR code generated for successful lending/borrowing
- QR code scanning ensures accountability during **pickup** and **return**

---

## 🔄 System Flow

1. **Register**  
   - User registers with BatStateU GSuite account  
   - First-time users complete profile setup  

2. **Login**  
   - Verified users access homepage with listed items  

3. **Lend/Borrow Path**  
   - Lender: Post items available for lending  
   - Borrower: Search/filter items needed  

4. **Request (Borrower)**  
   - Borrower sends request with time/date + message  
   - System notifies lender  

5. **Decision (Lender)**  
   - Accept → Transaction proceeds  
   - Decline → Borrower notified, request cancelled  

6. **Pickup/Meetup**  
   - Lender generates “Checkout QR Code”  
   - Borrower scans to confirm item borrowed  

7. **Return**  
   - Borrower generates QR code  
   - Lender scans to confirm item returned  

8. **Ratings & Feedback**  
   - Both parties rate each other (1–5 stars + short feedback)  

---

## 👥 Target Users
- **Batangas State University Students**  
- Especially those who often face resource shortages (chargers, calculators, umbrellas, etc.)  

---

## 🚀 Future Enhancements
- 📌 Mobile app integration for faster access  
- 📌 AI-based item recommendation system  
- 📌 Gamified reputation badges for trusted lenders/borrowers  

---

## 🏫 About
**Lend-A-Spartan** is a project developed for Batangas State University to foster **collaboration, accountability, and resource-sharing** among students.  
It aims to reduce stress caused by forgotten or missing essentials and build a culture of **trust and responsibility** on campus.

---
