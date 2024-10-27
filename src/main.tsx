import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'


import {
    createBrowserRouter, Outlet,
    RouterProvider,
} from "react-router-dom";
import Auth from "@/routes/Auth.tsx";
import Login from "@/pages/Login.tsx";
import Register from "@/pages/Register.tsx";

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
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
