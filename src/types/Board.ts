export type BoardResult = {
    name: string,
    slug_id: string,
    is_owner: boolean,
    created_at: string
}

export type BoardCreateResult = {
    name: string,
    slug_id: string,
    is_owner: boolean,
    created_at: string 
}

export type InviteRequest = {
    email: string
    board_id: number
}