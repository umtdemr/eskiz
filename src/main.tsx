import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

const Auth = lazy(() => import('@/routes/Auth.tsx'))
const Login = lazy(() => import('@/pages/Auth/Login.tsx'))
const Register = lazy(() => import('@/pages/Auth/Register.tsx'))
const PrivateRoute = lazy(() => import('@/routes/PrivateRoute.tsx'))
const BoardsRoute = lazy(() => import('@/routes/Boards.tsx'))
const BoardsPage = lazy(() => import('@/pages/boards/Boards.tsx'))
const Search = lazy(() => import('./pages/boards/Search'))
const Deleted = lazy(() =>
    import('@/pages/boards/Deleted.tsx').then((m) => ({ default: m.Deleted })),
)
const SingleBoard = lazy(() => import('@/pages/boards/SingleBoard.tsx'))
const StandaloneBoard = lazy(() => import('@/pages/boards/StandaloneBoard.tsx'))

const isStandalone = import.meta.env.VITE_APP_MODE === 'standalone'

const backendRoutes = [
    {
        path: '/',
        element: <Auth />,
        children: [
            {
                path: '/',
                element: <Login />,
            },
            {
                path: '/login',
                element: <Login />,
            },
            {
                path: '/register',
                element: <Register />,
            },
        ],
    },
    {
        path: '/boards',
        element: (
            <PrivateRoute>
                <BoardsRoute />
            </PrivateRoute>
        ),
        children: [
            {
                path: '/boards',
                element: <BoardsPage />,
            },
            {
                path: '/boards/search',
                element: <Search />,
            },
            {
                path: '/boards/deleted',
                element: <Deleted />,
            },
        ],
    },
    {
        path: '/boards/:id',
        element: (
            <PrivateRoute>
                <SingleBoard />
            </PrivateRoute>
        ),
    },
]

const standaloneRoutes = [
    {
        path: '/',
        element: <StandaloneBoard />,
    },
]

const router = createBrowserRouter(
    isStandalone ? standaloneRoutes : backendRoutes,
)

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <Toaster position="bottom-center" reverseOrder={false} />
            <Suspense fallback={null}>
                <RouterProvider router={router} />
            </Suspense>
            <ReactQueryDevtools />
        </QueryClientProvider>
    </StrictMode>,
)
