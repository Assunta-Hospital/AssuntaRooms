# 🏥 Assunta Rooms

A full-stack meeting room booking system built for **Assunta Hospital**, designed to streamline department-level meeting room reservations!

---

## 🚀 Project Overview

**Assunta Rooms** is a web-based application that allows hospital staff to:

- Sign up and log in securely
- Choose their department
- Browse and book available meeting rooms
- View and manage their bookings

This project was built using:

- [Next.js](https://nextjs.org/) – React framework for building fast and scalable web apps  
- [Tailwind CSS](https://tailwindcss.com/) – utility-first CSS framework for styling  
- [Supabase](https://supabase.com/) – open-source backend-as-a-service used for authentication and database (PostgreSQL)
- [Firebase Studio](https://studio.firebase.google.com/) – low-code prototyping tool used for initial UI development  

---

# Prerequisites

1. [Node.js](https://nodejs.org/en) (v18 or newer recommended)
   - Required to run and build the app
   - Check with:

   ```bash

   node -v

2. [npm](https://www.npmjs.com/) (comes with Node.js)
   - For managing packages
   - Check with:

   ```bash

   npm -v

3. [git](https://git-scm.com/downloads)
   - To clone the repository and manage version control
   - Check with:

   ```bash

   git --version

4. [Supabase](https://supabase.com/) project + keys
   - Sign up at supabase.com
   - Create a new project
   - Paste the contents of sql into supabase SQL editor and run it
   - Get your SUPABASE_URL and SUPABASE_ANON_KEY from the project settings > API [step 3](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
   - Add them to .env.local like:

   ```bash

   NEXT_PUBLIC_SUPABASE_URL=<https://your-project.supabase.co>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

---

# Getting Started

To run this project locally using **npm**:

1. **Clone the repository**

   ```bash
   git clone https://github.com/Assunta-Hospital/AssuntaRooms.git
   cd AssuntaRooms

2. **Install dependencies**

   ```bash
   npm install

3. **(Optional) Update outdated packages**

   ```bash
   npm update

4. **Run it locally**

   ```bash
   npm run dev
