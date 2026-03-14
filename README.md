# MHS Class of 2018 — Alumni Hub 🐾

A private alumni hub for the **Magnolia High School Class of 2018**.
Reconnect with classmates, coordinate reunions, and keep your contact info up to date.

---

## Features

| Feature | Details |
|---------|---------|
| **Class Directory** | Searchable & filterable directory of all registered classmates |
| **Direct Messaging** | Private inbox + conversation threads with email notifications |
| **Reunion Hub** | Event listings, RSVP (Going / Maybe / Not Attending), attendee lists |
| **Class Map** | Interactive map of classmate locations (US cities) |
| **Lost Classmates** | See who hasn't registered yet |
| **Admin Dashboard** | Approve accounts, manage events, send announcements, export CSV |

---

## Tech Stack

- **Frontend** — React 18 + Vite + Tailwind CSS
- **Backend** — Node.js + Express
- **Database** — PostgreSQL
- **Auth** — JWT (stored in localStorage, sent as Authorization header)
- **Email** — Nodemailer (via Gmail App Password)

---

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 18+
- PostgreSQL (running locally or a cloud instance)

### 2. Clone & install

```bash
git clone <repo-url> MHS-2018
cd MHS-2018
npm install
```

### 3. Set up the database

Create a PostgreSQL database:

```bash
createdb mhs2018
psql -d mhs2018 -f database/schema.sql
psql -d mhs2018 -f database/seed.sql
```

### 4. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/mhs2018
JWT_SECRET=at_least_32_random_characters_here
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Gmail (see Gmail Setup below)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.gmail@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="MHS Class of 2018 <your.gmail@gmail.com>"
```

### 5. Create the admin account

```bash
node server/scripts/createAdmin.js
```

Follow the prompts to set your admin email and password.

### 6. Start the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Gmail Setup for Email Notifications

1. Enable 2-Factor Authentication on your Gmail account
2. Go to **Google Account → Security → 2-Step Verification → App Passwords**
3. Select **Mail** as the app and **Other** as the device (name it "MHS Alumni Hub")
4. Copy the generated 16-character password into `SMTP_PASS` in `server/.env`

> Email is optional for development. If `SMTP_USER`/`SMTP_PASS` are not set, emails are skipped and a log message appears in the console.

---

## Deploying on Replit

### 1. Create a new Replit project

- Import from GitHub or upload the repository
- Choose **Node.js** as the template

### 2. Set up PostgreSQL

- In Replit, go to **Tools → Database** and provision a PostgreSQL database
- Copy the `DATABASE_URL` Replit provides

### 3. Set Secrets (Environment Variables)

In Replit, go to **Tools → Secrets** and add:

```
DATABASE_URL        = <from Replit PostgreSQL>
JWT_SECRET          = <32+ random characters>
JWT_EXPIRES_IN      = 7d
PORT                = 3000
NODE_ENV            = production
CLIENT_URL          = https://your-repl-name.replit.app
SMTP_HOST           = smtp.gmail.com
SMTP_PORT           = 587
SMTP_USER           = your.gmail@gmail.com
SMTP_PASS           = your_app_password
EMAIL_FROM          = "MHS Class of 2018 <your.gmail@gmail.com>"
```

> **Note:** Replit runs on port 3000 — set `PORT=3000` in secrets.

### 4. Configure `.replit` run command

Create a `.replit` file in the project root:

```toml
run = "npm run build && npm run start"
```

This builds the React app and then starts the Express server, which serves the built client.

### 5. Initialize the database

Open the Replit Shell tab and run:

```bash
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/seed.sql
node server/scripts/createAdmin.js
```

### 6. Deploy

Click **Run** in Replit. Your app will be live at `https://your-repl.replit.app`.

---

## Project Structure

```
MHS-2018/
├── package.json          # Root: npm workspaces + concurrently
├── .env.example          # Environment variable template
├── .gitignore
├── database/
│   ├── schema.sql        # Database tables + indexes
│   └── seed.sql          # Class roster seed data
├── server/
│   ├── index.js          # Express entry point
│   ├── config/db.js      # PostgreSQL pool
│   ├── middleware/       # auth.js, adminOnly.js
│   ├── routes/           # auth, users, messages, events, rsvps, admin
│   ├── utils/mailer.js   # Email notifications
│   └── scripts/          # createAdmin.js
└── client/
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx           # Router + layout
        ├── context/          # AuthContext
        ├── api/client.js     # Fetch wrapper
        ├── components/       # Navbar, cards, thread, buttons
        └── pages/            # All pages + admin/
```

---

## Admin Guide

### Approving New Accounts

1. Log in as admin → **Admin Dashboard**
2. Click **Manage Users**
3. Pending accounts appear at the top with **Approve** / **Reject** buttons
4. Approved users receive an email notification

### Creating a Reunion Event

1. Admin Dashboard → **Manage Events** → **+ Create Event**
2. Fill in title, date/time, location, description
3. Optionally add a Google Maps link and ticket purchase link

### Sending an Announcement

1. Admin Dashboard → **Announcements**
2. Type your subject and message
3. Click **Send to All Members** — all approved users receive it via BCC

### Exporting the Class List

Admin Dashboard → **Download CSV** — downloads a spreadsheet of all approved members with name, email, city, career, etc.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (32+ chars) |
| `JWT_EXPIRES_IN` | Yes | Token expiry, e.g. `7d` |
| `PORT` | Yes | Server port (5000 locally, 3000 on Replit) |
| `NODE_ENV` | Yes | `development` or `production` |
| `CLIENT_URL` | Yes | Frontend URL (used in email links) |
| `SMTP_HOST` | Optional | SMTP host (default: smtp.gmail.com) |
| `SMTP_PORT` | Optional | SMTP port (default: 587) |
| `SMTP_USER` | Optional | Email username |
| `SMTP_PASS` | Optional | Email app password |
| `EMAIL_FROM` | Optional | "From" display name and address |

---

## Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens expire after 7 days
- Route middleware verifies JWT on every protected endpoint
- Admin routes require `is_admin = true` in the database
- Users can only edit their own profile
- Email BCC is used for announcements to protect member privacy
- New accounts require admin approval before accessing any data

---

*Built for the Magnolia Bulldogs, Class of 2018. Go Dawgs! 🐾*
