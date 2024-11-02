import {AuthTokenSuccessResponse} from "@/types/Auth.ts";

export function addTokenToCookies(tokenData: AuthTokenSuccessResponse) {
    document.cookie = `token=${tokenData.token};expires=${tokenData.expiry};path=/`;
}

export function removeTokenFromCookies() {
    document.cookie = `token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;`;
}