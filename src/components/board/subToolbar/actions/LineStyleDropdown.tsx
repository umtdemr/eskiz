import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import './ShapeBorderColorDropdown.scss'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip'
import { Slider } from '@/components/ui/slider'
import { BorderStyle, DEFAULT_SHAPE_THICKNESS } from '@/helpers/Constant'
import clsx from 'clsx'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { CommandCtx } from '@/core/command/Command'
import { Line } from '@/core/shapes/line/Line'
import { MoveRight, MoveLeft, MoveHorizontal, Minus } from 'lucide-react'

export interface LineStyleDropdownProps {
    engine: Engine
}

export function LineStyleDropdown({ engine }: LineStyleDropdownProps) {
    const [thickness, setThickness] = useState(DEFAULT_SHAPE_THICKNESS)
    const [borderStyle, setBorderStyle] = useState<BorderStyle>(
        BorderStyle.SOLID,
    )
    const [hasHeadArrow, setHasHeadArrow] = useState(false)
    const [hasTailArrow, setHasTailArrow] = useState(false)

    useEffect(() => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        if (selectionService.selected.length !== 1) {
            return
        }
        const selectedWidget = selectionService.selected[0]

        if (!(selectedWidget instanceof Line)) {
            return
        }

        const thickness = selectedWidget.strokeWidth as number
        const style = selectedWidget.borderStyle as BorderStyle
        const head = selectedWidget.hasHeadArrow as boolean
        const tail = selectedWidget.hasTailArrow as boolean

        setThickness(thickness || 2)
        setBorderStyle(style || BorderStyle.SOLID)
        setHasHeadArrow(head)
        setHasTailArrow(tail)
    }, [engine])

    const changeBorderStyle = (newStyle: BorderStyle) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return
        if (!selectionService.canAllChangeBorderStyle()) return

        // if the style is not changed
        if (
            widgets.every(
                (widget) =>
                    widget instanceof Line && widget.borderStyle === newStyle,
            )
        ) {
            return
        }

        const command = engine.getCommand('changeBorderStyle')
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
                (widget) =>
                    widget instanceof Line && widget.strokeWidth === thickness,
            )
        ) {
            return
        }

        setThickness(thickness)
        const command = engine.getCommand('changeThickness')
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

    const changeArrowPoisition = (head: boolean, tail: boolean) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return
        // Check if all are lines
        if (!widgets.every((w) => w instanceof Line)) return

        if (hasHeadArrow === head && hasTailArrow === tail) return

        setHasHeadArrow(head)
        setHasTailArrow(tail)

        const ctx: CommandCtx = {
            selectionService,
            engine,
            params: {
                widgets,
                hasHeadArrow: head,
                hasTailArrow: tail,
            },
        }

        engine.getCommand('changeLineArrow').execute(ctx)
    }

    return (
        <div className="shape_border_color_dd absolute bg-white py-2 px-1 top-[60px] left-[50%] shadow-l -translate-x-1/2 w-[200px] rounded-xl shadow-xs select-none">
            {/* Border style */}
            <div className="flex justify-center mb-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={clsx('borderStyleBtn', {
                                active: borderStyle === BorderStyle.SOLID,
                            })}
                            onClick={() => changeBorderStyle(BorderStyle.SOLID)}
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
                                    strokeWidth="2"
                                    strokeLinecap="round"
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
                                    strokeWidth="2"
                                    strokeLinecap="butt"
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
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Dotted</p>
                    </TooltipContent>
                </Tooltip>
            </div>

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
                <span className="text-xs mb-1 block">Line Arrow</span>
                <div className="flex justify-between gap-1">
                    {/* None */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={clsx('h-8 w-8', {
                                    active: !hasHeadArrow && !hasTailArrow,
                                    'bg-muted': !hasHeadArrow && !hasTailArrow,
                                })}
                                onClick={() =>
                                    changeArrowPoisition(false, false)
                                }
                            >
                                <Minus
                                    className="h-5 w-5"
                                    color={
                                        !hasHeadArrow && !hasTailArrow
                                            ? 'rgb(29, 78, 216)'
                                            : 'black'
                                    }
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>None</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* tail */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={clsx('h-8 w-8', {
                                    active: !hasHeadArrow && hasTailArrow,
                                    'bg-muted': !hasHeadArrow && hasTailArrow,
                                })}
                                onClick={() =>
                                    changeArrowPoisition(false, true)
                                }
                            >
                                <MoveLeft
                                    className="h-5 w-5"
                                    color={
                                        !hasHeadArrow && hasTailArrow
                                            ? 'rgb(29, 78, 216)'
                                            : 'black'
                                    }
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Start</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* head */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={clsx('h-8 w-8', {
                                    active: hasHeadArrow && !hasTailArrow,
                                    'bg-muted': hasHeadArrow && !hasTailArrow,
                                })}
                                onClick={() =>
                                    changeArrowPoisition(true, false)
                                }
                            >
                                <MoveRight
                                    className="h-5 w-5"
                                    color={
                                        hasHeadArrow && !hasTailArrow
                                            ? 'rgb(29, 78, 216)'
                                            : 'black'
                                    }
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>End</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* both */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={clsx('h-8 w-8', {
                                    active: hasHeadArrow && hasTailArrow,
                                    'bg-muted': hasHeadArrow && hasTailArrow,
                                })}
                                onClick={() => changeArrowPoisition(true, true)}
                            >
                                <MoveHorizontal
                                    className="h-5 w-5"
                                    color={
                                        hasHeadArrow && hasTailArrow
                                            ? 'rgb(29, 78, 216)'
                                            : 'black'
                                    }
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Both</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}
