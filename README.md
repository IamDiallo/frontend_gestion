# WaKiLiX Commercial Management System - Frontend

This is the frontend application for the WaKiLiX Commercial Management System, built with React, TypeScript, and Material UI.

## Features

- Dashboard with key performance indicators and statistics
- Product management (catalog, inventory, pricing)
- Sales management (orders, invoices, quotes)
- Client management (companies and individuals)
- Responsive design for desktop and mobile devices

## Technology Stack

- **React**: A JavaScript library for building user interfaces
- **TypeScript**: A typed superset of JavaScript
- **Material UI**: A comprehensive UI component library
- **React Router**: For navigation and routing
- **Vite**: For fast development and optimized builds

## Getting Started

### Prerequisites

- Node.js (v18.x or later recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Development

To start the development server:

```
npm run dev
```

or

```
yarn dev
```

The application will be available at `http://localhost:5173` by default.

## Simplified Deployment Process

We've streamlined the deployment process to make it as simple as possible:

### 1. Quick Build (Windows Users)

Run the included batch file for a guided build process:
```
build.bat
```

### 2. Manual Build

Build the application for production:
```
npm run build
```

The built files will be in the `dist` directory.

### 3. Verify Deployment Readiness

On Windows, use the included checker:
```
check_deployment.bat
```

### 4. Deploy

Simply copy the contents of the `dist` directory to your web server.

For detailed instructions, see:
- [README-DEPLOYMENT.md](./README-DEPLOYMENT.md) - Simple deployment guide
- [SIMPLE_DEPLOYMENT.md](./SIMPLE_DEPLOYMENT.md) - Additional deployment options

## Environment Configuration

Configure your application using the following environment files:
- `.env.development` - For development settings
- `.env.production` - For production settings

## Project Structure

- `src/components/`: React components
- `src/App.tsx`: Main application component
- `src/main.tsx`: Entry point
- `src/index.css`: Global styles

## Integration with Backend

This frontend application communicates with the Django REST API backend. The API endpoints are defined in the backend documentation.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
