// React imports

// Third-party imports
import { Outlet } from 'react-router-dom';

// Internal imports - Components
import { ErrorBoundary } from './components';

// Internal imports - Context
import { ThemeProvider } from './context';

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
