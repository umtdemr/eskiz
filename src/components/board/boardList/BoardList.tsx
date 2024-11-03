import {Badge} from "@/components/ui/badge.tsx";
import {BoardResult} from "@/types/Board.ts";
import {useNavigate} from "react-router-dom";

export function BoardList({ boards } : { boards: BoardResult[] }) {
    const navigate = useNavigate();
    
    return (
        boards.map(board => (
            <div 
                role='button'
                tabIndex={0}
                key={board.slug_id} 
                onClick={() => navigate(`/boards/${board.slug_id}`)}
                className='rounded-b shadow-md w-[300px] border-2 border-white hover:border-zinc-200 cursor-pointer select-none'
            >
                <div className='h-36 relative flex justify-center items-center' style={{ backgroundSize: '15px 15px', backgroundImage: 'radial-gradient(circle, #999 1px, rgba(0 0 0 / 0%) 1px)'}}>
                    {
                        board.is_owner ? <Badge className='absolute right-2 top-2 select-none'>
                            owner
                        </Badge> : null
                    }
                    <span className='text-sm tracking-widest font-black font-mono border-2 rounded-xl bg-yellow-100 p-5'>
                        WB
                    </span>
                </div>
                <div className='p-5'>
                    <h2 className='text-md font-bold'>{board.name}</h2>
                    <span className='text-xs '>{new Date(board.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        ))
    )
}