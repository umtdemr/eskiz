import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface FontSizeInputProps {
    inputId: string
}
export function FontSizeInput({ inputId }: FontSizeInputProps) {
    const handleIncrease = () => {
        console.log('increase')
    }
    const handleDecrease = () => {
        console.log('decrease')
    }

    return (
        <div className="flex gap-[1px]">
            <div>
                <input
                    id={inputId}
                    value="12"
                    type="text"
                    role="combobox"
                    maxLength={3}
                    className="min-w-[36px] max-w-[36px] h-[24px] text-center outline-blue-600"
                />
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
