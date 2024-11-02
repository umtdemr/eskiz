import {EnvelopeAuthTokenSuccessResponse, UserGetMeReqResponse, UserPublicData} from "@/types/Auth.ts";
import {addTokenToCookies, removeTokenFromCookies} from "@/helpers/AuthHelper.ts";
import {API_ENDPOINTS} from "@/helpers/Constant.ts";
import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";
import {useNavigate} from "react-router-dom";
import {initialUserData} from "@/store/userSlice.ts";

export default function useAuth() {
    const setUserData = useBoundStore(useShallow((state) => state.changeUserData))
    const setLoginFailed = useBoundStore(useShallow((state) => state.setLoginFailed))
    const isLoggedIn = useBoundStore(useShallow((state) => state.userData.email.length > 0))
    const isLoginFailed = useBoundStore(useShallow((state) => state.loginFailed))
    const setToken = useBoundStore(useShallow((state) => state.setToken))
    
    const navigate = useNavigate()
    
    const login = async (data: EnvelopeAuthTokenSuccessResponse) => {
        addTokenToCookies(data.authentication_token)
        setToken(data.authentication_token.token)
        return fetchUserData(data.authentication_token.token)
    }
    
    const logout = () => {
        setUserData(initialUserData)
        setToken('');
        removeTokenFromCookies()
        navigate('/');
    }
    
    const fetchUserData = async (token: string) => {
        try {
            const getMeReq = await fetch(API_ENDPOINTS.USER_ME, {
                method: 'GET',
                credentials: 'omit',
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const userJsonData = await getMeReq.json()
            const userEnvelopedData = userJsonData.user as UserGetMeReqResponse;

            const publicUserData: UserPublicData = {
                ...userEnvelopedData,
                created_at: new Date(userEnvelopedData.created_at)
            }

            setUserData(publicUserData)
            return true
        } catch (err) {
            console.log('error while fetching user data', err)
            setLoginFailed(true)
        }
        return false
    }
    
    const tryLoginWithCookie = async () => {
        try {
            const regexp = new RegExp('token' + '=([^;]+)');
            const regexResult=  regexp.exec(document.cookie);
            if (regexResult) {
                await fetchUserData(regexResult[1])
                setToken(regexResult[1])
            } else {
                setLoginFailed(true);
            }
        } catch (err) {
            console.error('error while logging in with cookie', err)
            setLoginFailed(true);
        }
    }
    
    const isTokenExist = () => {
        const regexp = new RegExp('token' + '=([^;]+)');
        const regexResult=  regexp.exec(document.cookie);
        return !!regexResult
    }
    
    return {
        login,
        fetchUserData,
        tryLoginWithCookie,
        isLoggedIn,
        isLoginFailed,
        isTokenExist,
        logout
    }
}