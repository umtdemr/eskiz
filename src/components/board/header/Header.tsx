import { EllipsisVertical } from "lucide-react";
import { Image } from 'lucide-react';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.tsx";

export default function Header({ name }: { name: string }) {
    return (
        <div className='flex fixed justify-between w-full p-5'>
            <div className='flex px-5 py-2 rounded-lg gap-2 items-center select-none bg-white shadow'>
                <span className='text-sm font-mono font-bold'>
                    WB
                </span>
                <div className='block w-[0.5px] h-full bg-zinc-300'></div>
                <span className='text-sm'>{ name }</span>
            </div>
            <div>
                <DropdownMenu>
                    <DropdownMenuTrigger><EllipsisVertical size={20}/></DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem><Image /> Import</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}