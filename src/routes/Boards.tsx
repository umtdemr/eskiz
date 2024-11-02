import {Outlet} from "react-router-dom";
import {SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import BoardsSidebar from "@/components/sidebar/BoardsSidebar.tsx";

export default function BoardsRoute() {
    return (
        <SidebarProvider>
            <BoardsSidebar />
            <main>
                <SidebarTrigger />
                <Outlet />
            </main>
        </SidebarProvider>
    )
}