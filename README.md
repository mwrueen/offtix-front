# Tabredon Client

Frontend React application for the Tabredon project management system.

## Features

- User authentication and registration
- Company management dashboard
- Project management with multiple views (List, Board, Gantt)
- Task management with drag-and-drop functionality
- Team collaboration tools
- Meeting notes and requirements tracking
- Responsive design

## Tech Stack

- **React** - Frontend framework
- **React Router** - Client-side routing
- **Context API** - State management
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client
- **React DnD** - Drag and drop functionality

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd tabredon-client
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

5. Start the development server
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── common/         # Common UI components
│   ├── company/        # Company management components
│   ├── landing/        # Landing page components
│   └── project/        # Project management components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── utils/              # Utility functions
├── App.js              # Main application component
└── index.js            # Application entry point
```

## Key Features

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes

### Project Management
- Create and manage projects
- Multiple project views (List, Board, Gantt)
- Task management with custom statuses
- Sprint planning and tracking

### Company Management
- Multi-company support
- Team member management
- Role-based permissions

### Collaboration
- Meeting notes
- Requirements tracking
- Team communication tools

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder. The build is minified and the filenames include hashes for caching.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.