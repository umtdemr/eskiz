import { Button } from '@/components/ui/button'
import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { useBoundStore } from '@/store/store'

export interface FontSizeInputProps {
    id: string
    inputId: string
    defaultValue?: number
}

const FONT_SIZE_OPTIONS = [10, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96]

export function FontSizeInput({
    id,
    inputId,
    defaultValue = 10,
}: FontSizeInputProps) {
    const [inputVal, setInputVal] = useState(defaultValue.toString())
    const inputRef = useRef<HTMLInputElement>(null)
    const { activeDropdown, setActiveDropdown, closeDropdown } = useBoundStore()
    const isDropdownMenuOpen = activeDropdown === 'fontSize'

    const handleInputFocus = () => {
        setActiveDropdown('fontSize')
    }

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputVal(e.target.value)
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

        handleFontSizeChange(parsedInt)
        closeDropdown()
    }

    const handleIncrease = () => {
        console.log('increase')
    }
    const handleDecrease = () => {
        console.log('decrease')
    }

    const handleFontSizeChange = (val: number) => {
        console.log('change', val)
        setInputVal(val.toString())
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
