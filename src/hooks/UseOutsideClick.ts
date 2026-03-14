import { useEffect, RefObject } from 'react'

export default function useOnClickOutside(
    ref: RefObject<HTMLElement>,
    handler: (event: Event) => void,
    active: boolean = true,
) {
    useEffect(() => {
        if (!active) {
            return
        }

        const listener = (event: Event) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return
            }
            handler(event)
        }

        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)

        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [ref, handler, active])
}
