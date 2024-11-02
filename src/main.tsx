import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'


import {
    createBrowserRouter, Outlet,
    RouterProvider,
} from "react-router-dom";
import Auth from "@/routes/Auth.tsx";
import Login from "@/pages/Auth/Login.tsx";
import Register from "@/pages/Auth/Register.tsx";
import { Toaster } from "react-hot-toast";
import Root from "@/routes/Root.tsx";
import PrivateRoute from "@/routes/PrivateRoute.tsx";
import BoardsRoute from "@/routes/Boards.tsx";
import BoardsPage from "@/pages/Boards.tsx";
import SingleBoard from "@/pages/SingleBoard.tsx";

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
