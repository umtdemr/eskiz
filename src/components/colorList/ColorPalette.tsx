import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { RgbColor, RgbColorPicker } from 'react-colorful'
import './ColorPalette.scss'
import useOnClickOutside from '@/hooks/UseOutsideClick'

export interface ColorPaletteProps {
    size: number
    onAdd: (color: RgbColor) => void
}
export function ColorPalette({ size, onAdd }: ColorPaletteProps) {
    const [color, setColor] = useState<RgbColor | undefined>()
    const [showColorPalette, setShowColorPalette] = useState(false)
    const btnRef = useRef<HTMLButtonElement>(null)
    const colorPaletteWrapperRef = useRef<HTMLDivElement>(null)

    const onClickOutsideHandler = (event: MouseEvent) => {
        if (!showColorPalette) return
        if (btnRef.current!.contains(event.target as Node)) {
            return
        }
        if (colorPaletteWrapperRef.current!.contains(event.target as Node)) {
            return
        }

        setShowColorPalette(false)
    }
    useOnClickOutside(colorPaletteWrapperRef, onClickOutsideHandler)

    const handleOnClick = () => {
        if (color && showColorPalette) {
            onAdd(color)
            setShowColorPalette(false)
            return
        } else if (showColorPalette) {
            setShowColorPalette(false)
        } else {
            setShowColorPalette(true)
        }
    }

    const handleOnChange = (color: RgbColor) => {
        setColor(color)
    }

    return (
        <div className="color_palette">
            <button
                className="flex items-center justify-center"
                onClick={handleOnClick}
                ref={btnRef}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                }}
            >
                <div className="w-full relative h-full rounded-full outline outline-1 outline-zinc-500 flex justify-center items-center">
                    {color ? (
                        <div
                            className="rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center"
                            style={{
                                backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b})`,
                                width: `${size}px`,
                                height: `${size}px`,
                            }}
                        ></div>
                    ) : (
                        <Plus size={19} />
                    )}
                </div>
            </button>
            <div
                className="color_palette__palette"
                ref={colorPaletteWrapperRef}
            >
                {showColorPalette && (
                    <div className="absolute left-[100%] top-[50%] -translate-y-1/2 ml-[16px]">
                        <RgbColorPicker
                            color={color}
                            onChange={handleOnChange}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
