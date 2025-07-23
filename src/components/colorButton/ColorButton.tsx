import clsx from 'clsx'

export interface ColorButtonProps {
    color: string
    ariaLabel: string
    onClick: () => void
    fillPercentage?: number
    size?: number
    showBorder?: boolean
}

export function ColorButton({
    ariaLabel,
    color,
    onClick,
    fillPercentage,
    size = 25,
    showBorder = true,
}: ColorButtonProps) {
    const appliedFillPercentage =
        fillPercentage !== null && fillPercentage !== undefined
            ? fillPercentage
            : 100
    return (
        <button
            className="flex items-center justify-center"
            aria-label={ariaLabel}
            onClick={onClick}
            style={{
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            <div
                className={clsx('w-full relative h-full rounded-full', {
                    'border-zinc-500 border-solid border-[1px]': showBorder,
                })}
            >
                <div
                    className="rounded-full absolute left-[50%] top-[50%]"
                    style={{
                        backgroundColor: color,
                        width: `${appliedFillPercentage}%`,
                        height: `${appliedFillPercentage}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                ></div>
            </div>
        </button>
    )
}
