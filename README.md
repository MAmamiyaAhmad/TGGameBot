Below is an example of a **README.md** file in English with extra emojis to make it visually appealing. This README also reflects the complete project structure including the additional `utils.ts` file.

---

# 🚀 SundaraX Games Bot

Welcome to the **SundaraX Games Bot** – an innovative Telegram bot built with TypeScript and [grammy](https://grammy.dev/). This bot offers a wide range of features including crypto faucet functionality, deposit (top-up) and withdrawal services, daily bonuses, fun games, referral rewards, support ticket management, and a powerful admin panel for user management.

---

## ✨ Key Features

- **💧 Multi-Crypto Top-Up**  
  Deposit and withdraw funds using various cryptocurrencies.  
  *All deposits are automatically converted to SundX at current market values.*

- **🎁 Daily Bonus**  
  Claim your daily bonus and boost your SundX balance!

- **🎮 Games**  
  Enjoy a variety of games to have some fun and earn rewards.

- **🤝 Referral System**  
  Invite friends and earn bonus SundX for every referral.

- **📊 User Dashboard**  
  View your balance, check your transaction history, and monitor your account details.

- **📞 Support**  
  Create support tickets, view your ticket history, and check the status of your tickets.

- **🛠 Admin Panel**  
  Super Admin and Admin users can manage regular users by:  
  - Banning/Unbanning users (banned users will not be able to use the bot)  
  - Adding/Reducing user balances (only positive values are accepted)  
  - Searching users by username or user ID  
  - **(Super Admin only)** Adding or removing admin privileges  
  - All admin actions are logged for transparency.

- **📝 Logging**  
  Every critical action is logged both to the terminal and a log file (`app.log`) for auditing purposes.

- **🔄 Utilities**  
  The `utils.ts` file provides helper functions, for example, converting amounts between different currencies.

---

## 📁 Project Structure

```
src/
├── adminActions.ts       # Admin functions (ban, unban, add/reduce balance, search user, add/remove admin) with logging
├── bot.ts                # Bot initialization, middleware, and main routing
├── database.ts           # Database initialization using better-sqlite3 (includes extra columns like first_name, last_name, is_admin)
├── faucetpay.ts          # Module for interacting with the FaucetPay API
├── handlers/
│   └── transactions.ts   # Handlers for deposit and withdrawal functionalities
├── logger.ts             # Logger module (logs messages to both console and a file)
├── menus.ts              # Definitions for reply and inline keyboards, and menu handlers (including admin features)
└── utils.ts              # Utility functions (e.g., currency conversion functions)
```

---

## 🛠 Requirements

- [Node.js](https://nodejs.org/) v14 or later
- [npm](https://www.npmjs.com/)

---

## 🔧 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/MAmamiyaAhmad/TGGameBot.git
   cd TGGameBot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root and add the following variables:

   ```env
   BOT_TOKEN=your_telegram_bot_token
   ADMIN_ID=your_admin_id
   SUPER_ADMIN_ID=your_super_admin_id
   DB_PATH=./data/database.sqlite
   FAUCETPAY_API_KEY=your_faucetpay_api_key
   ```

   Replace the placeholders with your actual credentials.

---

## 🚀 Compilation & Running

1. **Compile the TypeScript code:**

   ```bash
   npx tsc
   ```

2. **Run the bot:**

   ```bash
   node dist/bot.js
   ```

---

## 📝 Logging

The bot logs every critical action (like admin actions, deposit/withdraw events, etc.) to both the terminal and a log file named `app.log` (located in the same directory as the compiled files).

Example log entries:
```
[2025-03-11T12:34:56.789Z] Admin 123456789 banned user 987654321
[2025-03-11T12:35:10.123Z] Notification of ban sent to user 987654321
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repository, create a new branch for your feature or bug fix, and submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📞 Support

If you have any questions or issues, please open an issue in the [Issue Tracker](https://github.com/MAmamiyaAhmad/TGGameBot/issues).

Enjoy using the **SundaraX Faucet Bot**! 🎉

---

This README should help you get started with the project and understand its structure and features.