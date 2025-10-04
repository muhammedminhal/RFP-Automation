import { Suspense } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import './assets/scss/main.scss';
import reportWebVitals from './reportWebVitals';
import routes from './routes/allRoutes';

const browserRouter = createBrowserRouter(routes);
const root = ReactDOM.createRoot(document.getElementById('root'));

// Simple loading component
const Loading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
    }}
  >
    Loading...
  </div>
);

root.render(
  <Suspense fallback={<Loading />}>
    <RouterProvider router={browserRouter} fallbackElement={<Loading />} />
  </Suspense>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
