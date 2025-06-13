import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'


import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import Auth from "@/routes/Auth.tsx";
import Login from "@/pages/Auth/Login.tsx";
import Register from "@/pages/Auth/Register.tsx";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "@/routes/PrivateRoute.tsx";
import BoardsRoute from "@/routes/Boards.tsx";
import BoardsPage from "@/pages/boards/Boards.tsx";
import SingleBoard from "@/pages/boards/SingleBoard.tsx";
import Search from './pages/boards/Search';
import {Deleted} from "@/pages/boards/Deleted.tsx";
import {initializeAllWidgets} from "@/core/initializers/registerWidgets.ts";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Auth />,
        children: [
            {
                path: "/",
                element: <Login />
            },
            {
                path: "/login",
                element: <Login />
            },
            {
                path: "/register",
                element: <Register />
            },
        ]
    },
    {
        path: "/boards",
        element: <PrivateRoute><BoardsRoute /></PrivateRoute>,
        children: [
            {
                path: "/boards",
                element: <BoardsPage />,
            },
            {
                path: "/boards/search",
                element: <Search />
            },
            {
                path: "/boards/deleted",
                element: <Deleted />
            }
        ]
    },
    {
        path: "/boards/:id",
        element: <PrivateRoute><SingleBoard /></PrivateRoute>
    }
])

const queryClient = new QueryClient()


createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
          <Toaster 
              position="bottom-center"
              reverseOrder={false}
          />
          <RouterProvider router={router} />
          <ReactQueryDevtools />
      </QueryClientProvider>
  </StrictMode>,
)

initializeAllWidgets()