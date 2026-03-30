1. Working Code
The complete solution is available in this repository:
Repository: https://github.com/samdasilva82/meeting-mind-challenge
Branch: feature/meeting-mind
Key Features Implemented:
AI-powered meeting analysis using Google Gemini (with fallback handling)
Structured extraction of: Summary, Action Items (with assignee detection), Decisions, and Open Questions
Master-detail dashboard with clean, professional UI (inspired by enterprise tools like BuildingConnected)
Full create and edit functionality for meetings
In-memory storage (due to persistent TypeORM setup issues on older hardware)
Graceful mock fallback when LLM quota is reached
The application runs locally with both frontend and backend. The dashboard is the default landing page (/), featuring a left list of meetings and a right detail panel that supports viewing and editing.
Note on Architecture Decisions:
Due to significant TypeORM dependency resolution issues on my 2017 MacBook Pro (Ventura), I temporarily disabled the database layer and used in-memory storage. The code is structured to easily swap back to a persistent store (SQLite or PostgreSQL). All AI logic remains securely on the backend — the frontend never calls the LLM directly.
2. Run Instructions
From a Clean Clone
# 1. Clone the repository
git clone https://github.com/samdasilva82/meeting-mind-challenge.git
cd meeting-mind-challenge

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
Edit the .env file and add your Google Gemini API key:
GOOGLE_API_KEY= Get a key from Gemini or use whichever one you decide.
# 4. Start the development servers
npx turbo dev
Access Points
Frontend (Dashboard): http://localhost:3000
Backend API: http://localhost:3001
Notes on Deviations from Starter
Switched from PostgreSQL + TypeORM to in-memory storage due to persistent dependency resolution issues with @nestjs/typeorm on older hardware (macOS Ventura + 2017 MacBook Pro). This allowed focusing on the core requirements: AI analysis and polished UI.
The project is fully functional without Docker for the database layer.
Used Google Gemini instead of OpenAI due to quota limits during development.
The application should start cleanly. The dashboard is the default view and supports creating, viewing, and editing meetings with AI-powered analysis.
