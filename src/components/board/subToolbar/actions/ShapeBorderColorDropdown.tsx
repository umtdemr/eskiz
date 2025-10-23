import { useState, useEffect, useRef } from 'react'
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
import { ChangeThickness } from '@/core/command/ChangeThickness'
import { ChangeBorderColor } from '@/core/command/ChangeBorderColor'
import { ChangeBorderStyle } from '@/core/command/ChangeBorderStyle'
import { ChangeRoundness } from '@/core/command/ChangeRoundness'
import { CommandCtx } from '@/core/command/Command'
import { Rectangle } from '@/core/shapes/Rectangle'

export interface ShapeBorderColorDropdownProps {
    engine: Engine
}

export function ShapeBorderColorDropdown({
    engine,
}: ShapeBorderColorDropdownProps) {
    const [opacity, setOpacity] = useState(1)
    const [thickness, setThickness] = useState(DEFAULT_SHAPE_THICKNESS)
    const [roundness, setRoundness] = useState(0)
    const [showRoundness, setShowRoundness] = useState(false)
    const [borderStyle, setBorderStyle] = useState<BorderStyle>(
        BorderStyle.SOLID,
    )
    const [showBorderStyle, setShowBorderStyle] = useState(false)

    const changeBorderColorCommandRef = useRef(
        new ChangeBorderColor('changeBorderColor'),
    )

    useEffect(() => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        if (selectionService.selected.length !== 1) {
            return
        }
        const selectedWidget = selectionService.selected[0]
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
        if (!widgets.length) return
        if (!selectionService.canAllChangeBorderStyle()) return

        // if the style is not changed
        if (widgets.every((widget) => widget.properties.borderStyle === newStyle))
            return

        const command = new ChangeBorderStyle('changeBorderStyle')
        const ctx: CommandCtx = {
            selectionService,
            engine,
            params: {
                widgets,
                border: newStyle,
            },
        }

        setBorderStyle(newStyle)
        command.execute(ctx)
    }

    const handleOpacityChange = (newOpacityArr: number[]) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        if (selectionService.selected.length !== 1) return

        const selected = selectionService.selected[0]
        const newOpacity = newOpacityArr[0]
        setOpacity(newOpacity)

        const color = {
            ...(selected.properties.strokeColor as RGBA),
            a: newOpacity,
        }

        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous: true,
            params: {
                color,
                widgets: [selected],
            },
        }
        changeBorderColorCommandRef.current?.execute(ctx)
    }

    const handleColorSelect = (signature: ColorSelectSignature) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return
        if (!selectionService.canAllChangeBorderStyle()) return

        const color = { ...signature.color, a: opacity }

        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous: !signature.isImmediate,
            params: {
                color,
                widgets,
            },
        }
        changeBorderColorCommandRef.current?.execute(ctx)
    }

    const handleThicknessChange = (thicknesses: number[]) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) {
            return
        }
        if (!selectionService.canAllChangeThickness()) {
            return
        }
        const thickness = thicknesses[0]

        // if the width is not changed
        if (
            widgets.every(
                (widget) => widget.properties.strokeWidth === thickness,
            )
        )
            return

        setThickness(thickness)
        const command = new ChangeThickness('changeThickness')
        const ctx = {
            selectionService,
            engine,
            params: {
                widgets,
                thickness,
            },
        }

        command.execute(ctx)
    }

    const handleRoundnessChange = (roundnessArr: number[]) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) {
            return
        }
        if (!selectionService.canAllChangeRoundness()) {
            return
        }
        const roundness = roundnessArr[0]

        // if the roundness is not changed
        if (
            widgets.every(
                (widget) => widget.properties.radius === roundness,
            )
        )
            return

        setRoundness(roundness)
        const command = new ChangeRoundness('changeRoundness')
        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous: true,
            params: {
                widgets,
                roundness,
            },
        }

        command.execute(ctx)
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
                                    active:
                                        borderStyle ===
                                        BorderStyle.SOLID,
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
                                    active:
                                        borderStyle ===
                                        BorderStyle.DASHED,
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
                                    active:
                                        borderStyle ===
                                        BorderStyle.DOTTED,
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
                <ColorList onColorSelect={handleColorSelect} perColumn={4} />
            </div>
        </div>
    )
}
