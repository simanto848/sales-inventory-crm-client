# Sales, Inventory & CRM Frontend Client

This is the premium React frontend dashboard application built with **Vite** and **React Router DOM**, designed to integrate seamlessly with the Sales, Inventory & CRM Laravel API.

## Key Features

1. **Dashboard Analytics:** Comprehensive statistics including total revenue, active/inactive customer counts, product listings, and employee sales volumes.
2. **Inventory Catalog:** Lists all products, prices, and branch stock levels. Features an integrated search and CRUD functionality (Add, Edit, and Delete Products).
3. **Store Branches:** Shows physical locations and maps branch-specific inventory quantities. Handles product catalog binding and stock adjustment/overrides.
4. **Customers CRM:** Displays customer logs (name, contact, purchase history, and assignment statuses). Highlights "Lost/Inactive" accounts who have not bought within 90 days. Features employee routing assignment and SMS/Email re-engagement modal actions.
5. **Sales & Orders Checkout:** Allows creating sales orders by picking store locations, assigning customers, searching and adding items to a basket, configuring discounts, taxes, and executing checkouts.
6. **Employees & KPIs:** Leaderboard displaying employees ranked by their sales volumes and converted inactive customers. Supports creating new staff user records.
7. **Premium Notification System:** Integrates a customized Toaster notification system and glassmorphism overlay dialogs to replace native browser alerts.

---

## Technical Stack
- **Build Tool:** Vite
- **UI Framework:** React
- **Routing:** React Router DOM
- **Client Queries:** Axios
- **Styling:** Custom responsive CSS variables (tailored for dark and light systems)

---

## Local Installation

### Prerequisites
- Node.js (>= 18.x)
- npm (>= 9.x)

### Step-by-Step Setup

1. **Navigate to the Client Directory:**
   ```bash
   cd client
   ```

2. **Install npm dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the `client` folder (an example `.env.example` has been provided):
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
   *Make sure your backend server is serving API requests on this URL (default: `http://localhost:8000/api`).*

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The client application will run locally and is typically accessible at: `http://localhost:5173/`

---

## User Accounts (Default Seeding)
To log in, use the default credentials provided by the backend seeder:

*   **Administrator Account:**
    *   **Email:** `admin@example.com`
    *   **Password:** `password123`
*   **Manager Account:**
    *   **Email:** `manager@example.com`
    *   **Password:** `password123`
*   **Employee Account:**
    *   **Email:** `alice@example.com` (or bob/carol/david/eva@example.com)
    *   **Password:** `password123`
