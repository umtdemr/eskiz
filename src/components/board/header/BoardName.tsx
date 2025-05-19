import React, {KeyboardEvent, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useBoundStore} from "@/store/store.ts";
import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {getTextDimension} from "@/helpers/TextHelpers.ts";
import {clsx} from "clsx";
import {Check} from "lucide-react";
import {toast} from "react-hot-toast"


export function BoardName() {
    const [isEditing, setIsEditing] = useState(false)
    const board = useBoundStore(useShallow((state) => state.boardData))
    const [value, setValue] = useState(board?.name || '')
    const user = useBoundStore(useShallow((state) => state.userData))
    const inputRef = useRef<HTMLInputElement>(null)

    const nameBtnClickHandler = () => {
        if (isEditing) {
            //...
        } else {
            setIsEditing(true)
            setTimeout(() => {
                changeInputWidth(value)
            }, 0)
        }
    }

    const changeInputWidth = (text: string) => {
        const dimension = getTextDimension(text, '14px "Open-Sans", sans_serif')
        const width = Math.min(dimension.width + 1, 300)
        inputRef.current!.style.width = `${width}px`
    }

    const changeNameHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        changeInputWidth(e.target.value)
        setValue(e.target.value)
    }

    const saveName = () => {
        if (value.trim() === "") {
            toast.error('Name cannot be empty')
            setIsEditing(false)
            return
        }
        setIsEditing(false)
        if (value !== board.name) {
            toast.success('Saved')
            useBoundStore.setState({
                boardData: {
                    ...board,
                    name: value
                }
            })
        }
    }

    const inputOnBlurHandler = () => {
        saveName()
    }

    const inputOnKeyDownHandler = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault()
            if (e.key === 'Enter') {
                saveName()
            } else {
                setIsEditing(false)
            }
        }
    }

    return (
        <div className='flex px-5 py-1 rounded-lg gap-1 items-center select-none bg-white shadow'>
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" asChild size="sm" className="text-base font-bold">
                            <Link to={"/boards"}>
                                WB
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={10}>Home</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {
                board.owner_id === user.id ? (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={clsx("text-sm max-w-[300px]", {
                                        "border-2 border-solid border-blue-400": isEditing
                                    })}
                                    size="sm"
                                    onClick={nameBtnClickHandler}>
                                    { isEditing ? (
                                        <input
                                            value={value}
                                            onChange={changeNameHandler}
                                            onBlur={inputOnBlurHandler}
                                            onKeyDown={inputOnKeyDownHandler}
                                            ref={inputRef}
                                            className="outline-none"
                                            autoFocus/>
                                    ) : <span className="overflow-hidden overflow-ellipsis">{board.name}</span>}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={10}>
                                { isEditing ? 'Press enter to save' : 'Click to edit' }
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : <span className="text-sm px-3">{board.name}</span>
            }
            {
                board.owner_id === user.id && isEditing  ? (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className=" h-6 bg-blue-600 text-white hover:text-white rounded-3xl w-6 hover:bg-blue-700" onClick={saveName}>
                                    <Check size={48}/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={10}>
                                Save
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : null
            }
        </div>
    )
}