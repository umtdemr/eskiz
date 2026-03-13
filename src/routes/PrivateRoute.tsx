import { useNavigate } from 'react-router-dom'
import useAuth from '@/hooks/UseAuth.tsx'
import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useBoundStore } from '@/store/store.ts'

export default function PrivateRoute({ children }) {
    const { tryLoginWithCookie, isLoggedIn, isLoginFailed } = useAuth()
    const setNavigatedToLogin = useBoundStore(
        (state) => state.setNavigatedToLogin,
    )
    const token = useBoundStore((state) => state.token)
    const isLoggingTried = useRef(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (isLoginFailed && !isLoggedIn) {
            setNavigatedToLogin(true)
            navigate('/')
            toast.error('you need to login to see this page', {
                id: 'loginErr',
            })
        }
    }, [isLoginFailed])

    if (!isLoggedIn) {
        isLoggingTried.current = true
        tryLoginWithCookie()
    }

    if (isLoggedIn && token) {
        return <>{children}</>
    }
}
