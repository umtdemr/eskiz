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