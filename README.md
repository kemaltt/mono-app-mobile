# Mono Project 📱💸

**Mono** is a modern, full-stack expense and budget tracking application designed to help users manage their finances efficiently. Built as a monorepo, it features a robust mobile application and a high-performance backend API.

## ✨ Key Features

- **Authenticated Experience:** Secure registration and login flow with biometrics support.
- **User Profile:**
  - Manage personal details (**First Name** & **LastName**).
  - Upload profile avatars (Camera/Gallery).
  - Change password & update email.
  - **Timezone Synchronization:** Automatic device timezone detection for accurate tracking.
- **Gamification System:** Earn **XP** and level up by tracking your finances and using AI features.
- **Financial Tracking:**
  - **Transaction Management:** Add Income & Expense transactions with categorization.
  - **Smart Attachments:** Upload and view receipts/invoices (Images & PDFs).
  - **AI Receipt Scanning:** Automated transaction data extraction using Gemini AI.
  - **Dashboard:** Real-time balance, income, and expense summary.
  - **Advanced Statistics:** Visual charts and AI-generated financial summaries.
- **Financial Planning:**
  - **Budgeting:** Set monthly budgets for specific categories and track progress.
  - **Subscription Management:** Track recurring payments with flexible billing cycles.
  - **Debts & Loans:** Keep track of personal lending and borrowing.
- **Membership Tiers:**
  - **Trial, Pro, & Ultimate:** Selective access to AI features with daily scanning limits.
- **Security & Privacy:**
  - **Account Protection:** 30-day account deletion grace period with easy recovery options.
- **Real-time Notifications:**
  - **In-App Notification Center:** Persistent alert history with "mark as read" functionality.
  - **Push Notifications:** Foreground & background alerts via Expo Push API.
  - **Interactive UI:** Dynamic swinging bell animation and modern premium notification badges.
- **Multi-Language:** Seamless switching between Turkish, English, and German.
- **Secure:** Data validation with Zod and full type-safety across the stack.

---

## 🚀 Tech Stack

### Mobile App (`apps/mobile`)

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Language:** TypeScript
- **Navigation:** Expo Router (File-based routing)
- **Internationalization:** i18next (Supports 🇹🇷 Turkish, 🇬🇧 English, 🇩🇪 German)
- **State:** React Context API (Auth, Theme)
- **Animations:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) (Animated Bell)
- **Notifications:** [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- **Date Handling:** native-community/datetimepicker & date-fns

### Backend API (`apps/api`)

- **Framework:** [Hono](https://hono.dev/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL (NeonDB)
- **AI Integration:** Google Gemini (Generative AI)
- **Auth:** JWT & Argon2
- **Email:** Nodemailer (For verifications and reminders)
- **Push Engine:** CRON-based engagement reminders and automated notify-on-history.

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

- **AI Expansion:** Integrated Google Gemini for high-accuracy receipt scanning and personalized spending insights.
- **Gamification Engine:** Launched the Level/XP system to reward consistent financial tracking.
- **Notification Center:** Launched full persistent history with real-time unread badges and an interactive animated notification bell.
- **Financial Suite:** Added dedicated modules for Budget Management, Subscription Tracking, and Debt/Loan logs.
- **Multi-Tier Membership:** Implemented Trial, Pro, and Ultimate plans with dedicated daily AI limits and modals.
- **Security & UX:** Added self-service account deletion/recovery and biometric login support.
- **Localization:** Full parity for all new features across Turkish, English, and German.

---

## 📝 License

This project is private and proprietary.
