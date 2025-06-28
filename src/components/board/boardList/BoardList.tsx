import { BoardResult } from '@/types/Board.ts'
import { BoardItem } from '@/components/board/boardList/BoardItem.tsx'

export function BoardList({ boards }: { boards: BoardResult[] }) {
    return boards.map((board) => (
        <BoardItem board={board} key={board.slug_id} />
    ))
}
