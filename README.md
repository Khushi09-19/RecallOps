RecallOps – Incident Response Assistant

Overview

RecallOps is an incident response assistant designed to help engineering and DevOps teams investigate recurring production incidents faster.

It stores incident details, root causes, resolutions and runbooks so engineers can review previous incidents and find relevant solutions.

Features

- Create and track incidents.
- Record root causes and resolutions.
- Mark incidents as resolved.
- View dashboard incident statistics.
- Search previous incidents using keywords.
- Recommend relevant runbooks.

Technology Stack

- Frontend: React, Vite
- Backend: Node.js, Express.js
- Database: MySQL
- Memory integration: Hindsight Cloud (integration configured; live retain/recall requires working Cloud access)

Project Structure

- "frontend/" – React application
- "backend/" – Express API and database connection
- "database/" – SQL database setup

Running Locally

1. Install Node.js and MySQL.
2. Install frontend and backend dependencies using "npm install" in their respective folders.
3. Configure your local environment variables using ".env.example".
4. Create the "recallops" database and import the SQL setup file.
5. Start the backend and frontend using their development scripts.

