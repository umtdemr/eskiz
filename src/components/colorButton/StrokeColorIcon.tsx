import clsx from 'clsx'
import { BgColorIconProps } from './BgColorIcon'

export function StrokeColorIcon({
    color = 'none',
    size = 24,
    className,
}: BgColorIconProps) {
    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={clsx('z-10', className)}
            >
                <path
                    d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"
                    stroke={color}
                />
            </svg>

            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={clsx('absolute', className)}
            >
                <defs>
                    <pattern
                        id="checkerboard-stroke"
                        width="8"
                        height="8"
                        patternUnits="userSpaceOnUse"
                    >
                        <rect width="8" height="8" fill="#fff" />
                        <rect width="4" height="4" fill="#ccc" />
                        <rect x="4" y="4" width="4" height="4" fill="#ccc" />
                    </pattern>
                </defs>

                <path
                    d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"
                    stroke="black"
                    strokeWidth="3"
                    fill="none"
                />
                <path
                    d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9"
                    stroke="url(#checkerboard-stroke)"
                    strokeWidth="2"
                    fill="none"
                />
            </svg>
        </>
    )
}
