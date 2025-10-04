import React from 'react';
import App from '../App';

const Login = React.lazy(() => import('../views/login'));
const Dashboard = React.lazy(() => import('../views/dashboard'));
const Search = React.lazy(() => import('../views/search'));
const RfpDocuments = React.lazy(() => import('../views/rfp-documents'));
const ClientDocuments = React.lazy(() => import('../views/client-documents'));
const Settings = React.lazy(() => import('../views/settings'));
const Help = React.lazy(() => import('../views/help'));
const Unauthorized = React.lazy(() => import('../views/unauthorized'));

// Simple error component
const ErrorPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>Page Not Found</h1>
    <a href='/'>Go to Login</a>
  </div>
);

export const routes = [
  {
    metaTitle: 'RFP Automation',
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      // Default route - Login page
      {
        metaTitle: 'Login',
        index: true,
        element: <Login />,
      },
      // Explicit login route
      {
        metaTitle: 'Login',
        path: '/login',
        element: <Login />,
      },
      // Dashboard page (main landing after login)
      {
        metaTitle: 'Dashboard - RFP Automation',
        path: '/dashboard',
        element: <Dashboard />,
      },
      // Search page
      {
        metaTitle: 'Search - RFP Automation',
        path: '/search',
        element: <Search />,
      },
      // RFP Documents page
      {
        metaTitle: 'RFP Documents - Document Management',
        path: '/rfp-documents',
        element: <RfpDocuments />,
      },
      // Client Documents page
      {
        metaTitle: 'Client Documents - RFP Automation',
        path: '/client-documents/:clientId',
        element: <ClientDocuments />,
      },
      // Settings page
      {
        metaTitle: 'Settings - RFP Automation',
        path: '/settings',
        element: <Settings />,
      },
      // Help page
      {
        metaTitle: 'Help - RFP Automation',
        path: '/help',
        element: <Help />,
      },
      // Unauthorized page
      {
        metaTitle: 'Access Denied - RFP Automation',
        path: '/unauthorized',
        element: <Unauthorized />,
      },
      // Catch all - redirect to login
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
];

export default routes;
