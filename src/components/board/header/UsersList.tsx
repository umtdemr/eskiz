import {Avatar, AvatarFallback} from "@/components/ui/avatar.tsx";
import {ChevronDown, UserRoundPlus} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";

export function UsersList() {
    // this is dummy data
    const allUsers = [
        {
            name: 'ümit demir',
            avatar: 'UD'
        },
        {
            name: 'ümit demir',
            avatar: 'KD'
        },
        {
            name: 'ümit demir',
            avatar: 'MD'
        },
        {
            name: 'ümit demir',
            avatar: 'TD'
        },
    ]
    return (
        <>
            <div
                className='flex relative bg-zinc-200 overflow-hidden border-2 h-9 rounded-full items-center group hover:border-blue-600 cursor-pointer'
            >
                <div className='flex'
                     style={{
                         width: `${(allUsers.length * 32) - ((allUsers.length - 1) * 12) }px`,
                         transform: `translateX(-${(allUsers.length - 1) * 12 }px)`
                     }}
                >
                        { allUsers.map((u, i) => (
                            <div className='relative' style={{ transform: i === allUsers.length - 1 ? 'translateX(0)' : `translateX(calc(12px * ${allUsers.length - 1 - i}))` }} key={i}>
                                <Avatar
                                    className='collab_avatar border-2 h-8 w-8 text-sm select-none'
                                    key={i}
                                    data-order={allUsers.length - 1 - i}
                                >
                                    <AvatarFallback>{u.avatar}</AvatarFallback>
                                </Avatar>
                            </div>
                        )) }
                </div>
                <button className='rounded-full h-max' title='see active users'>
                    <ChevronDown size={16} />
                </button>
            </div>
            <Button className='bg-blue-700 hover:bg-blue-900'>
                <UserRoundPlus />
                Invite
            </Button>
        </>
    )
}