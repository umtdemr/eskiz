import clsx from 'clsx'

export interface BgColorIconProps {
    color?: string
    size?: number
    className?: string
}

export function BgColorIcon({
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
                fill={color}
                strokeWidth="2"
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
                        id="checkerboard-bg"
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
                    stroke="url(#checkerboard-bg)"
                    strokeWidth="2"
                    fill="url(#checkerboard-bg)"
                />
            </svg>
        </>
    )
}
