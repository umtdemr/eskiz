import {Outlet} from "react-router-dom";
import {SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import BoardsSidebar from "@/components/sidebar/BoardsSidebar.tsx";

export default function BoardsRoute() {
    return (
        <SidebarProvider>
            <BoardsSidebar />
            <main className='w-full p-10'>
                <div className='flex items-center'>
                    <SidebarTrigger />
                    <h2 className='inline-block tracking-tighter font-extralight'>Whiteboard</h2>
                </div>
                <div className='w-full h-[1px] bg-stone-400 my-5' />
                <Outlet />
            </main>
        </SidebarProvider>
    )
}