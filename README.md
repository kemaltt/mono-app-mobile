# Mono Project 📱💸

**Mono** is a modern, full-stack expense and budget tracking application designed to help users manage their finances efficiently. Built as a monorepo, it features a robust mobile application and a high-performance backend API.

## 🚀 Tech Stack

### Mobile App (`apps/mobile`)

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Language:** TypeScript
- **Navigation:** Expo Router (File-based routing)
- **Internationalization:** i18next (Supports 🇹🇷 Turkish, 🇬🇧 English, 🇩🇪 German)
- **Styling:** StyleSheet (Reviewing for migration to Tailwind/NativeWind if needed)
- **Networking:** Fetch API with local IP detection support

### Backend API (`apps/api`)

- **Framework:** [Hono](https://hono.dev/) (Fast, lightweight web framework)
- **Runtime:** Node.js
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL (NeonDB)
- **Authentication:** JWT & Argon2 (Secure password hashing)
- **File Storage:** Local filesystem with static serving (Auto-detects `http` vs `https` for local dev)

---

## ✨ Key Features

- **Authenticated Experience:** Secure registration and login flow.
- **User Profile:**
  - Manage personal details (**First Name** & **Last Name**).
  - Upload profile avatars (Camera/Gallery).
  - Change password & update email.
- **Financial Tracking:**
  - Add Income & Expense transactions.
  - Categorize transactions (Food, Salary, Shopping, etc.).
  - **Attachments:** Upload receipts/invoices (Images & PDFs) to transactions.
  - **Dashboard:** Real-time balance, income, and expense summary.
  - **Statistics:** Visual charts for financial analysis.
- **Multi-Language:** Seamless switching between Turkish, English, and German.
- **Secure:** Data validation with Zod and type-safety across the board.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or pnpm
- PostgreSQL database (or connection string)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repo-url>
    cd mono
    ```

2.  **Install dependencies (Root):**

    ```bash
    npm install
    ```

3.  **Database Setup:**

    - Navigate to `apps/api`
    - Create a `.env` file with your `DATABASE_URL` and `JWT_SECRET`.
    - Run migrations:
      ```bash
      npx prisma generate
      npx prisma db push
      ```

4.  **Environment Configuration:**
    - **API:** Ensure `.env` is set.
    - **Mobile:** Update `constants/Config.ts` with your machine's Local IP address if running on a real device/simulator to ensure images load correctly.

### Running the Project

You can run both apps concurrently or separately.

**Backend (API):**

```bash
cd apps/api
npm run dev
# OR
npx tsx src/index.ts
```

_Server runs on port 4040._

**Mobile App:**

```bash
cd apps/mobile
npm run ios   # For iOS Simulator
npm run android # For Android Emulator
```

---

## 🔄 Recent Updates

- **Name Refactor:** Migrated user identity from a single `name` field to distinct `firstName` and `lastName` fields for better data structure.
- **Attachment Fixes:** Solved issues with displaying images on local networks by dynamically switching URL protocols (`http` vs `https`).
- **UI Enhancements:** Improved Registration and Transaction Detail screens for a better user experience.

---

## 📝 License

This project is private and proprietary.
