import { Button } from '@/components/ui/button'
import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBoundStore } from '@/store/store'
import { Engine } from '@/core/engine/Engine'
import { SelectionService } from '@/core/services/SelectionService'
import { ChangeFontSize } from '@/core/command/ChangeFontSize'
import { CommandCtx } from '@/core/command/Command'
import { TextBox } from '@/core/shapes/text/TextBox'
import { Shape } from '@/core/shapes/Shape'

export interface FontSizeInputProps {
    id: string
    inputId: string
    engine: Engine
}

const FONT_SIZE_OPTIONS = [10, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96]

export function FontSizeInput({
    id,
    inputId,
    engine,
}: FontSizeInputProps) {
    const [inputVal, setInputVal] = useState('14')
    const inputRef = useRef<HTMLInputElement>(null)
    const changeFontSizeCommandRef = useRef(new ChangeFontSize('changeFontSize'))
    const { activeDropdown, setActiveDropdown, closeDropdown } = useBoundStore()
    const isDropdownMenuOpen = activeDropdown === 'fontSize'

    useEffect(() => {
        const selectionService =
            engine.getService<SelectionService>('selection')

        if (selectionService.selected.length !== 1) {
            return
        }
        const selectedWidget = selectionService.selected[0]

        if (selectedWidget instanceof TextBox) {
            setInputVal(selectedWidget.fontSize.toString())
        } else if (selectedWidget instanceof Shape) {
            if (selectedWidget.textProperties) {
                setInputVal(selectedWidget.textProperties.fontSize.toString())
            }
        }
    }, [engine, activeDropdown])

    const handleInputFocus = () => {
        setActiveDropdown('fontSize')
    }

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setInputVal(newValue)
    }

    const handleOnKeyUp = (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter') {
            return
        }

        // blur input
        if (inputRef.current) {
            inputRef.current.blur()
        }

        if (!inputVal) return

        const parsedInt = parseInt(inputVal)
        if (!parsedInt || parsedInt < FONT_SIZE_OPTIONS[0]) return

        executeFontSizeChange(parsedInt, false)
        closeDropdown()
    }

    const executeFontSizeChange = (size: number, isContinuous: boolean) => {
        const selectionService =
            engine.getService<SelectionService>('selection')
        const widgets = selectionService.selected
        if (!widgets.length) return
        if (!selectionService.canAllChangeFontSize()) return

        const ctx: CommandCtx = {
            selectionService,
            engine,
            isContinuous,
            params: {
                fontSize: size,
                widgets,
            },
        }

        changeFontSizeCommandRef.current?.execute(ctx)
    }

    const findNextFontSize = (current: number): number => {
        for (const size of FONT_SIZE_OPTIONS) {
            if (size > current) {
                return size
            }
        }
        return FONT_SIZE_OPTIONS[FONT_SIZE_OPTIONS.length - 1]
    }

    const findPreviousFontSize = (current: number): number => {
        for (let i = FONT_SIZE_OPTIONS.length - 1; i >= 0; i--) {
            if (FONT_SIZE_OPTIONS[i] < current) {
                return FONT_SIZE_OPTIONS[i]
            }
        }
        return FONT_SIZE_OPTIONS[0]
    }

    const handleIncrease = () => {
        const current = parseInt(inputVal)
        if (!current) return
        const newSize = findNextFontSize(current)
        setInputVal(newSize.toString())
        executeFontSizeChange(newSize, true)
    }

    const handleDecrease = () => {
        const current = parseInt(inputVal)
        if (!current) return
        const newSize = findPreviousFontSize(current)
        setInputVal(newSize.toString())
        executeFontSizeChange(newSize, true)
    }

    const handleFontSizeChange = (val: number) => {
        setInputVal(val.toString())
        executeFontSizeChange(val, false)
        closeDropdown()
    }

    return (
        <div className="flex gap-[1px]" id={id}>
            <div className="relative">
                <input
                    id={inputId}
                    value={inputVal}
                    onChange={handleOnChange}
                    type="text"
                    role="combobox"
                    maxLength={3}
                    className="min-w-[36px] max-w-[36px] h-[24px] text-center outline-blue-600"
                    onFocus={handleInputFocus}
                    onKeyUp={handleOnKeyUp}
                    ref={inputRef}
                    autoComplete="off"
                />
                <div
                    className={clsx(
                        'absolute bg-white py-2 px-1 top-[40px] left-[-5px] rounded-l shadow-l',
                        {
                            hidden: !isDropdownMenuOpen,
                        },
                    )}
                >
                    {FONT_SIZE_OPTIONS.map((option) => (
                        <button
                            key={option}
                            className="text-center w-10 hover:bg-slate-100 rounded-l text-sm py-2"
                            onClick={() => handleFontSizeChange(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col">
                <Button
                    className="w-[30px] h-[25px] text-black bg-white shadow-none hover:bg-white flex flex-col justify-start"
                    onClick={handleIncrease}
                >
                    <ChevronUp className="stroke-black" />
                </Button>
                <Button
                    className="w-[30px] h-[25px] text-black bg-white shadow-none hover:bg-white flex flex-col justify-end"
                    onClick={handleDecrease}
                >
                    <ChevronDown className="stroke-black" />
                </Button>
            </div>
        </div>
    )
}
