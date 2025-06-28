import { metadata } from '@/types/Pagination.ts'

export type BoardResult = {
    name: string
    slug_id: string
    is_owner: boolean
    created_at: string
}

export type BoardsWithPagination = {
    board_results: BoardResult[]
    metadata: metadata
}

export type BoardCreateResult = {
    name: string
    slug_id: string
    is_owner: boolean
    created_at: string
}

export type BoardRetrieveResponse = {
    board: {
        data: {
            id: number
            name: string
            owner_id: number
            slug_id: string
            created_at: string
            pages: {
                id: number
                board_id: number
                created_at: string
                name: string
            }[]
        }
        users: {
            full_name: string
            email: string
            id: number
            role: string
        }[]
    }
}

export type InviteRequest = {
    email: string
    board_id: number
}
