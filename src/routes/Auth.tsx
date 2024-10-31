import {Outlet, useNavigate} from "react-router-dom";
import useAuth from "@/hooks/UseAuth.tsx";
import {useEffect} from "react";
import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";


export default function Auth() {
    const { isLoggedIn, tryLoginWithCookie, isTokenExist, isLoginFailed } = useAuth()
    const isNavigatedToLogin = useBoundStore(useShallow((state) => state.navigatedToLogin))
    const navigate = useNavigate()
    
    useEffect(() => {
        if (isLoggedIn) {
            navigate('/boards')
        }
    }, [isLoggedIn])

    useEffect(() => {
        if (!isNavigatedToLogin && !isLoginFailed && isTokenExist()) {
            tryLoginWithCookie()
        }
    }, [isLoginFailed, isNavigatedToLogin]);
    
    
    return (
        <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    WB
                </div>
                <div className="z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;Just another collaboration app&rdquo;
                        </p>
                        <footer className="text-sm">WB TEAM</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <Outlet />
            </div>
        </div>
    )
}