import {useShallow} from "zustand/react/shallow";
import {useCallback} from "react";
import {Avatar, AvatarFallback} from "@/components/ui/avatar.tsx";
import {ChevronDown, UserRoundPlus} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {useBoundStore} from "@/store/store.ts";

export function UsersListDropdown({
    users
}: { 
    users: {
        avatar: string,
        name: string
    }[]
}) {
    const isUsersListCardActive = useBoundStore(useShallow((state) => state.activeWindow)) === 'online_users_list'
    const openNewWindow = useBoundStore(useShallow((state) => state.openWindow))
    const closeAllWindows = useBoundStore(useShallow((state) => state.closeAllWindows))
    const collaborators = useBoundStore(useShallow((state) => state.collaboratorsList)).filter((_, i) => i < 3)
    
    const toggleUsersCardList = useCallback(() => {
        if (isUsersListCardActive) {
            closeAllWindows()
        } else {
            openNewWindow('online_users_list');
        }
    }, [isUsersListCardActive, openNewWindow, closeAllWindows])
    
    const openInviteModal = useCallback(() => {
        openNewWindow('invite');
    }, [openNewWindow])
    
    return (
        <>
            <div
                className='flex relative bg-zinc-200 border-2 h-9 rounded-full items-center group hover:border-blue-600 cursor-pointer'
                role='button'
                tabIndex={-1}
                onClick={toggleUsersCardList}
            >
                <div className='flex'
                     style={{
                         width: `${(collaborators.length * 32) - ((collaborators.length - 1) * 12) }px`,
                         transform: `translateX(-${(collaborators.length - 1) * 12 }px)`
                     }}
                >
                        { collaborators.map((u, i) => (
                            <div className='relative' style={{ transform: i === collaborators.length - 1 ? 'translateX(0)' : `translateX(calc(12px * ${collaborators.length - 1 - i}))` }} key={i}>
                                <Avatar
                                    className='collab_avatar border-2 h-8 w-8 text-sm select-none'
                                    key={i}
                                    data-order={collaborators.length - 1 - i}
                                >
                                    <AvatarFallback>{u.avatar}</AvatarFallback>
                                </Avatar>
                            </div>
                        )) }
                </div>
                <button 
                    onClick={toggleUsersCardList}
                    className='rounded-full h-max' 
                    title='see active users'>
                    <ChevronDown size={16} />
                </button>
            </div>
            <Button 
                className='bg-blue-700 hover:bg-blue-900'
                onClick={openInviteModal}
            >
                <UserRoundPlus />
                Invite
            </Button>
        </>
    )
}