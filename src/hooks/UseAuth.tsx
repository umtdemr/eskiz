import {EnvelopeAuthTokenSuccessResponse} from "@/types/Auth.ts";
import {addTokenToCookies} from "@/helpers/AuthHelper.ts";

export default function useAuth() {
    const login = (data: EnvelopeAuthTokenSuccessResponse) => {
        addTokenToCookies(data.authentication_token)
    }
    
    return {
        login
    }
}