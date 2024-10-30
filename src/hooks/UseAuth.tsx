import {EnvelopeAuthTokenSuccessResponse} from "@/types/Auth.ts";
import {addTokenToCookies} from "@/helpers/AuthHelper.ts";
import {API_ENDPOINTS} from "@/helpers/Constant.ts";

export default function useAuth() {
    const login = async (data: EnvelopeAuthTokenSuccessResponse) => {
        addTokenToCookies(data.authentication_token)

        const userData = await fetch(API_ENDPOINTS.USER_ME, {
            method: 'GET',
            credentials: 'omit',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${data.authentication_token.token}`
            }
        })
        
        console.log(userData)
    }
    
    return {
        login
    }
}