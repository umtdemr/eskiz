import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import './ShapeBorderColorDropdown.scss'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Slider } from '@/components/ui/slider'
import {
    ColorList,
    ColorSelectSignature,
} from '@/components/colorList/ColorList'
import { BorderStyle, DEFAULT_SHAPE_THICKNESS } from '@/helpers/Constant'
import clsx from 'clsx'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { RGBA } from '@/core/shapes/Color'
import { Rectangle } from '@/core/shapes/Rectangle'

export interface ShapeBorderColorDropdownProps {
    engine: Engine
    onColorChange: (colorStr: string, isImmediate?: boolean) => void
    onOpacityChange: (opacity: number) => void
}

export function ShapeBorderColorDropdown({
    engine,
    onColorChange,
    onOpacityChange,
}: ShapeBorderColorDropdownProps) {
    const [opacity, setOpacity] = useState(1)
    const [thickness, setThickness] = useState(DEFAULT_SHAPE_THICKNESS)
    const [roundness, setRoundness] = useState(0)
    const [showRoundness, setShowRoundness] = useState(false)
    const [borderStyle, setBorderStyle] = useState<BorderStyle>(
        BorderStyle.SOLID,
    )
    const [showBorderStyle, setShowBorderStyle] = useState(false)

    useEffect(() => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        const { selected } = selectionService
        // shapes have more options than paths, show theirs
        const selectedWidget =
            selected.find((w) => w instanceof Rectangle) ??
            selected.find((w) => w.widgetType === 'shape') ??
            selected.find((w) => w.widgetType === 'path')
        if (!selectedWidget) return

        if (selectedWidget.widgetType === 'path') {
            const color = selectedWidget.properties.color as RGBA
            const thickness = selectedWidget.properties.strokeWidth as number

            setOpacity(color?.a || 1)
            setThickness(thickness || 2)
            setShowBorderStyle(false)
            setShowRoundness(false)
            return
        }

        // Handle shape widgets
        if (selectedWidget.widgetType !== 'shape') {
            return
        }

        const color = selectedWidget.properties.strokeColor as RGBA
        const thickness = selectedWidget.properties.strokeWidth as number
        const style = selectedWidget.properties.borderStyle as BorderStyle
        const shouldShowBorderStyle =
            selectedWidget.properties.borderStyle !== undefined

        setOpacity(color.a)
        setThickness(thickness)
        setBorderStyle(style || BorderStyle.SOLID)
        setShowBorderStyle(shouldShowBorderStyle)

        // check if the widget is a rectangle and has roundness
        if (selectedWidget instanceof Rectangle) {
            const radius = selectedWidget.properties.radius as number
            setRoundness(radius || 0)
            setShowRoundness(true)
        } else {
            setShowRoundness(false)
        }
    }, [engine])

    const changeBorderStyle = (newStyle: BorderStyle) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected

        // if the style is not changed
        if (
            widgets.every(
                (widget) => widget.properties.borderStyle === newStyle,
            )
        )
            return

        if (engine.execute('changeBorderStyle', { border: newStyle })) {
            setBorderStyle(newStyle)
        }
    }

    const handleOpacityChange = (newOpacityArr: number[]) => {
        const newOpacity = newOpacityArr[0]
        setOpacity(newOpacity)
        onOpacityChange(newOpacity)
    }

    const handleColorSelect = (signature: ColorSelectSignature) => {
        const color = { ...signature.color, a: opacity }

        const executed = engine.execute(
            'changeBorderColor',
            { color },
            { continuous: !signature.isImmediate },
        )
        if (!executed) return

        onColorChange(
            `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
            signature.isImmediate,
        )
    }

    const handleThicknessChange = (thicknesses: number[]) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        const thickness = thicknesses[0]

        // if the width is not changed
        if (
            widgets.every(
                (widget) => widget.properties.strokeWidth === thickness,
            )
        )
            return

        if (
            engine.execute(
                'changeThickness',
                { thickness },
                { continuous: true },
            )
        ) {
            setThickness(thickness)
        }
    }

    const handleRoundnessChange = (roundnessArr: number[]) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        const roundness = roundnessArr[0]

        // if the roundness is not changed
        if (widgets.every((widget) => widget.properties.radius === roundness))
            return

        if (
            engine.execute(
                'changeRoundness',
                { roundness },
                { continuous: true },
            )
        ) {
            setRoundness(roundness)
        }
    }

    return (
        <div className="shape_border_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
            {/* Border style */}
            {showBorderStyle && (
                <div className="flex justify-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className={clsx('borderStyleBtn', {
                                    active: borderStyle === BorderStyle.SOLID,
                                })}
                                onClick={() =>
                                    changeBorderStyle(BorderStyle.SOLID)
                                }
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M 2 12 H 22"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                    />
                                </svg>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Solid</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className={clsx('borderStyleBtn', {
                                    active: borderStyle === BorderStyle.DASHED,
                                })}
                                onClick={() =>
                                    changeBorderStyle(BorderStyle.DASHED)
                                }
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M 2 12 h 4 M 10 12 h 4 M 18 12 h 4"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="butt"
                                    />
                                </svg>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Dashed</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className={clsx('borderStyleBtn', {
                                    active: borderStyle === BorderStyle.DOTTED,
                                })}
                                onClick={() =>
                                    changeBorderStyle(BorderStyle.DOTTED)
                                }
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M 4 12 h 0.01 M 9 12 h 0.01 M 14 12 h 0.01 M 19 12 h 0.01"
                                        stroke="currentColor"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                    />
                                </svg>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Dotted</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )}

            <div className="p-2">
                <span className="text-xs mb-1 block">Thickness</span>
                <Slider
                    value={[thickness]}
                    max={20}
                    step={2}
                    min={DEFAULT_SHAPE_THICKNESS}
                    onValueChange={handleThicknessChange}
                />
            </div>

            <div className="p-2">
                <span className="text-xs mb-1 block">Opacity</span>
                <Slider
                    value={[opacity]}
                    max={1}
                    step={0.1}
                    min={0.1}
                    onValueChange={handleOpacityChange}
                />
            </div>

            {showRoundness && (
                <div className="p-2">
                    <span className="text-xs mb-1 block">Roundness</span>
                    <Slider
                        value={[roundness]}
                        max={100}
                        step={10}
                        min={0}
                        onValueChange={handleRoundnessChange}
                    />
                </div>
            )}
            <div className="p-2">
                <ColorList
                    onColorSelect={handleColorSelect}
                    perColumn={4}
                    shouldHideTransparentColor
                />
            </div>
        </div>
    )
}
