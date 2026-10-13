# WeatherApp

A weather application built with React, TypeScript, and Vite. The project is currently under development.

## Features

- User registration and login
- Form validation
- Login session management using localStorage
- Protected home page
- Responsive user interface
- Animated components using Motion
- Weather dashboard (in development)

## Tech Stack

**Frontend**

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- TanStack Query
- React Hook Form
- Lucide React
- Motion

**Backend**

- Node.js
- Fastify
- TypeScript

**Testing**

- Vitest

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

git clone https://github.com/itsqyp/weatherApp.git
cd weatherApp

Install dependencies:

npm install

### Run the Frontend

npm run dev

The frontend will usually be available at:

http://localhost:5173

### Run the Backend

Open a separate terminal and run:

npm run server

The backend will run at:

http://localhost:3000

Health check endpoint:

http://localhost:3000/api/health

## Project Structure

src/
├── components/
├── data/
├── features/
│ └── auth/
├── pages/
├── App.tsx
├── index.css
└── main.tsx

server/
└── index.ts

## Development Status

The project is under active development. Authentication and initial UI components are being implemented. Weather data integration and additional pages will be added in future updates.

## License

No license has been specified yet.
