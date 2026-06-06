import { Providers } from './providers';
import { AppRouter } from './routes';

export const App = () => (
  <Providers>
    <AppRouter />
  </Providers>
);