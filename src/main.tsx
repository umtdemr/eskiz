import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Button } from "@/components/ui/button"


import {
    createBrowserRouter, Outlet,
    RouterProvider,
} from "react-router-dom";
import Auth from "@/routes/Auth.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Auth />,
    },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
