import {
    Sidebar,
    SidebarContent, SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from "@/components/ui/sidebar.tsx";
import {Link} from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu.tsx";
import {DropdownMenuTrigger} from "@radix-ui/react-dropdown-menu";
import {Avatar, AvatarFallback} from "@/components/ui/avatar.tsx";
import {LogOut, PresentationIcon, Trash, User} from "lucide-react";
import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";
import useAuth from "@/hooks/UseAuth.tsx";

const sidebarItems = [
    {
        title: 'All boards',
        disabled: false,
        url: '/boards',
        icon: <PresentationIcon />
    },
    {
        title: 'My boards',
        disabled: true,
        url: '#',
        icon: <span className='relative'>
                <PresentationIcon className='w-[16px] h-[16px]' /> 
                <User className='absolute left-[5px] top-[3px] w-[8px] h-[8px]' />
            </span>
    },
    {
        title: 'Deleted boards',
        disabled: true,
        url: '#',
        icon: <Trash />
    },
    
]

export default function BoardsSidebar() {
    const userData = useBoundStore(useShallow((state) => state.userData));
    const { logout } = useAuth()

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent className='mt-10'>
                        <SidebarMenu>
                            {
                                sidebarItems.map(item => (
                                    <SidebarMenuItem key={item.title}>
                                       <SidebarMenuButton asChild>
                                           <Link to={item.url}>
                                               {item.icon}
                                               {item.title}
                                           </Link>
                                       </SidebarMenuButton> 
                                    </SidebarMenuItem>
                                ))
                            }
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu state={open}>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className='py-5'>
                                    <div className="flex items-center gap-2 px-1 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg">{userData.full_name[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{userData.full_name}</span>
                                            <span className="truncate text-xs">{userData.email}</span>
                                        </div>
                                    </div> 
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg mb-2"
                                side='right'
                                sideOffset={15}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg">{userData.full_name[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{userData.full_name}</span>
                                            <span className="truncate text-xs">{userData.email}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { logout() }}>
                                    <LogOut />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu> 
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}