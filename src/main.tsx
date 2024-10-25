import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import Root from "./routes/Root.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        children: [
            {
                path: "/",
                element: <div>hello world</div>
            }
        ]
    },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
