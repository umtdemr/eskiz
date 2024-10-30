import {AuthTokenSuccessResponse} from "@/types/Auth.ts";

export function addTokenToCookies(tokenData: AuthTokenSuccessResponse) {
    document.cookie = `token=${tokenData.token};expires=${tokenData.expiry};path=/`;
}