# My Life OS (Project REMEMBER)

> **"Your personalized, always-on executive assistant."**

**My Life OS** is a desktop-native "Life OS" designed to act as a second brain. I built this to consolidate scattered knowledge, manage tasks, and provide intelligent briefings in a unified, immersive interface. 

Unlike traditional productivity apps, this system resides on the desktop as a persistent "Cockpit." It offers real-time context and AI-driven insights to keep you focused, essentially acting as a personal Jarvis.

![Dashboard Screenshot](https://via.placeholder.com/800x450?text=Project+Screenshot+Placeholder)
*(Replace this link with an actual screenshot)*

---

## ✨ Key Features

### 🖥️ Executive Dashboard (The Cockpit)
- **Bento Grid Layout:** A highly organized, single-view interface for maximum efficiency.
- **Real-time Context:** Live clock (seconds precision) and local weather updates.
- **AI Briefing Core:** Natural language summaries of your current status ("Executive Briefing").
- **Trend Tracking:** A "Daily Issues" module to keep up with IT trends and news.

### 🧠 AI Interaction & RAG
- **Visual AI Core:** A responsive, animated orb that visualizes the AI's state (Idle, Processing, Speaking).
- **Context-Aware Chat:** Seamless switching between command execution and conversation. The AI uses a RAG (Retrieval-Augmented Generation) pipeline to understand context from your past chats and notes.

### 📝 Memory (Second Brain)
- **Notion-Style Editor:** A powerful block-based editor supporting rich text, lists, and formatting without the clutter. 
- **Smart Tagging:** Archive and filter your notes quickly using a custom hashtag system.
- **Distraction-Free UX:** Borderless, seamless writing experience built into the dark mode UI.

### 🎨 Design & OS Integration
- **Monotone Aesthetic:** A sleek, dark-mode-only design to reduce eye strain and maintain focus.
- **Frameless Window:** Custom drag-and-drop controls with a non-standard, futuristic window frame.
- **System Deep Dive:** Built with Electron for deep OS integration and local file system access.

---

## 🛠️ Tech Stack

Built with a modern, type-safe architecture.

**Frontend (Desktop Client)**
- **Framework:** React 18, TypeScript, Vite
- **Desktop Runtime:** Electron
- **Styling:** Tailwind CSS
- **Editor:** BlockNote (Notion-style rich text)

**Backend & AI**
- **Framework:** NestJS 
- **Database:** MongoDB
- **AI Pipeline:** LLM (Gemini/OpenAI) with custom RAG architecture

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (Local instance or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/MyLifeOS.git](https://github.com/YOUR_USERNAME/MyLifeOS.git)
   cd MyLifeOS
   
2. **Install Frontend Dependencies**
   ```bash
   npm install
   
3. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   
4. **Environment Setup**
   Create a .env file in both the client and server directories. You will need to provide your MongoDB URI and LLM API keys (see .env.example for details).

5. **Run the Application**
   ```Bash
   # Terminal 1: Start the NestJS backend
   npm run start:dev

   # Terminal 2: Start the Electron client
   npm run dev
