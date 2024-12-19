import {UsersListDropdown} from "@/components/board/header/UsersListDropdown.tsx";
import {UsersListCard} from "@/components/board/header/UsersListCard.tsx";

export default function Header({ name }: { name: string }) {
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
                className='fixed top-5 left-5'
                id='header_left'>
                <div className='flex px-5 py-2 rounded-lg gap-2 items-center select-none bg-white shadow'>
                <span className='text-sm font-mono font-bold'>
                    WB
                </span>
                    <div className='block w-[0.5px] h-full bg-zinc-300'></div>
                    <span className='text-sm'>{ name }</span>
                </div>
            </div>
            <div className='fixed top-5 right-5 flex bg-white shadow px-2 py-2 rounded-xl h-12 items-center gap-2'>
                <UsersListDropdown users={allUsers} />
                <UsersListCard users={allUsers} />
            </div>
        </>
    )
}