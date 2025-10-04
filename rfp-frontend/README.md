# RFP Automation Frontend

A modern, production-ready React application for RFP (Request for Proposal) automation with intelligent document processing and search capabilities.

## 🚀 Features

- **Modern React Architecture**: Built with React 18, React Router v6, and modern hooks
- **Responsive Design**: Mobile-first design with dark/light theme support
- **Document Management**: Upload and manage RFP documents with intelligent processing
- **Advanced Search**: Hybrid search combining keyword and semantic search
- **Authentication**: Secure Google OAuth integration with JWT tokens
- **Production Ready**: Optimized builds, linting, formatting, and testing

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v6, Sass
- **Authentication**: Google OAuth 2.0, JWT
- **HTTP Client**: Axios
- **Build Tool**: Create React App
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest, React Testing Library

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd RFP-Automation/rfp-frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🚀 Available Scripts

### Development
```bash
npm start              # Start development server
npm run test:watch     # Run tests in watch mode
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
npm run format         # Format code with Prettier
```

### Production
```bash
npm run build          # Build for production
npm run build:prod     # Build with production environment
npm run build:analyze  # Build and analyze bundle size
npm run serve          # Serve production build locally
```

### Quality Assurance
```bash
npm run test           # Run tests with coverage
npm run test:ci        # Run tests for CI/CD
npm run lint:check     # Check linting without warnings
npm run format:check   # Check code formatting
npm run precommit      # Run all quality checks
```

### Maintenance
```bash
npm run clean          # Clean build artifacts
npm run prebuild       # Run pre-build checks
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (Button, Loading, etc.)
│   └── layout/         # Layout components (Sidebar, ProfileMenu)
├── config/             # Configuration files
├── constants/          # Application constants and configuration
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── routes/             # Route definitions and configuration
├── services/           # API services and business logic
├── utils/              # Utility functions
└── views/              # Page components
    ├── dashboard/      # Dashboard page
    ├── login/          # Authentication pages
    ├── search/         # Search functionality
    ├── rfp-documents/  # Document management
    └── ...
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
```

### API Integration

The application integrates with the following backend services:

- **Authentication**: Google OAuth and JWT token management
- **Document Upload**: File upload with validation and processing
- **Search**: Hybrid search with keyword and semantic capabilities
- **User Management**: Profile and settings management

## 🎨 Theming

The application supports both light and dark themes with CSS custom properties:

```scss
// Light theme variables
:root {
  --bg-primary: #ffffff;
  --text-primary: #333333;
  --accent-primary: #e74c3c;
}

// Dark theme variables
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
  --accent-primary: #e74c3c;
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:ci

# Run specific test file
npm test -- --testPathPattern=Search.test.js
```

## 📦 Build and Deployment

### Production Build

```bash
npm run build:prod
```

The build artifacts will be stored in the `build/` directory.

### Bundle Analysis

```bash
npm run build:analyze
```

This will generate a visual representation of your bundle composition.

### Deployment

The application can be deployed to any static hosting service:

- **Netlify**: Connect your repository for automatic deployments
- **Vercel**: Deploy with zero configuration
- **AWS S3**: Upload build files to S3 bucket
- **Nginx**: Serve static files with Nginx

## 🔒 Security

- **HTTPS**: Enforced in production
- **Content Security Policy**: Configured for XSS protection
- **Authentication**: Secure JWT token management
- **Input Validation**: Client-side validation for all forms

## 📊 Performance

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Bundle Optimization**: Minified and optimized production builds
- **Caching**: Strategic caching for static assets and API responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run quality checks (`npm run precommit`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Code Standards

- **ESLint**: Configured with React and accessibility rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages
- **Component Structure**: Consistent component organization

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**: Run `npm run clean` and rebuild
2. **Linting Errors**: Run `npm run lint:fix` to auto-fix issues
3. **Test Failures**: Check test coverage and update tests as needed

### Performance Issues

1. **Bundle Size**: Use `npm run build:analyze` to identify large dependencies
2. **Runtime Performance**: Check React DevTools for component performance
3. **Network Issues**: Verify API endpoints and proxy configuration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` directory

---

**Built with ❤️ by the InApp RFP Automation Team**