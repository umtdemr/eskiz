export type LoginRequest = {
    email: string,
    password: string
}

export type RegisterRequest = {
    full_name: string,
    email: string,
    password: string
}


export type AuthTokenSuccessResponse = {
    expiry: string,
    token: string
}

export type EnvelopeAuthTokenSuccessResponse = {
    authentication_token: AuthTokenSuccessResponse
}

export type UserPublicData = {
    id: number,
    full_name: string,
    email: string,
    version?: number,
    authProvider: "email",
    created_at: Date,
}

// user get me response data
export type UserGetMeReqResponse = UserPublicData & {
    created_at: string
}