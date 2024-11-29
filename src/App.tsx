import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import React, { Suspense } from 'react';
import type { RouteType } from '~/routes';
import { routes } from '~/routes';
import { Loading } from './pages/Loading';

interface Props {
  route: RouteType;
}

const DomTitle: React.FC<Props> = ({ route }) => {
  React.useEffect(() => {
    if (route.meta?.title) {
      document.title = `${route.meta.title} | Reactease`;
    }
  }, [route]);

  return (
    <Suspense fallback={<Loading />}>
      <route.element />
    </Suspense>
  );
};

export default function App() {
  return <>
    <Router>
      <Routes>
        {routes.map((route) => (
          <Route
            path={route.path}
            key={route.path}
            element={<DomTitle route={route} />}
          />
        ))}
      </Routes>
    </Router>
  </>;
}
