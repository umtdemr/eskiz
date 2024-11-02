import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";
import {Button} from "@/components/ui/button.tsx";
import {Plus} from "lucide-react";
import {Badge} from "@/components/ui/badge.tsx";

export default function BoardsPage() {
    const user = useBoundStore(useShallow((state) => state.userData))
    return (
        <>
            <div className=''>
                <div className='flex justify-between'>
                    <span className='text-xl font-bold'>All boards</span>
                    <Button className='bg-indigo-600 hover:bg-indigo-500'>
                        <Plus /> create new
                    </Button>
                </div>
                
                {/*Template*/}
                <div className='flex bg-gray-100 py-5 px-6 mt-5'>
                    <div 
                        role='button'
                        className='group select-none'>
                        <div className=''>
                            <div className='w-40 h-28 flex justify-center items-center bg-slate-50 rounded-lg group-hover:bg-slate-100 group-hover:border-2'>
                                <Plus size={16} />
                            </div>
                            <span className='text-slate-700 text-sm group-hover:text-slate-950'>Blank board</span>
                        </div> 
                    </div>
                </div>


                {/*Board lists*/}
                <div className='flex mt-10 flex-wrap gap-x-5 gap-y-10'>
                    {
                        Array.from(Array(10).keys()).map(i => (
                            <div key={i} className='rounded-b shadow-md w-[300px] border-2 border-white hover:border-zinc-200 cursor-pointer select-none'>
                                <div className='h-36 relative flex justify-center items-center' style={{ backgroundSize: '15px 15px', backgroundImage: 'radial-gradient(circle, #999 1px, rgba(0 0 0 / 0%) 1px)'}}>
                                    <Badge className='absolute right-2 top-2 select-none'>
                                        owner
                                    </Badge>
                                    <span className='text-sm tracking-widest font-black font-mono border-2 rounded-xl bg-yellow-100 p-5'>
                                        WB
                                    </span>
                                </div>
                                <div className='p-5'>
                                    <h2 className='text-md font-bold'>My whiteboard</h2>
                                    <span className='text-xs '>24 oct 2024</span>
                                </div>
                            </div> 
                        ))
                    }
                </div>
            </div>
        </>
    )
}