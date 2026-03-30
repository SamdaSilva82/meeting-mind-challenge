import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/dashboard.tsx'),
  route('intro', 'routes/home.tsx'),
  route('new', 'routes/new.tsx'),
] satisfies RouteConfig;
