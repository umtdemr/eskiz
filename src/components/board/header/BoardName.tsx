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
import {Engine} from "@/core/engine/Engine.ts";
import {BoardNameService} from "@/core/services/BoardNameService.ts";


export function BoardName({ engine }: { engine: Engine }) {
    const [isEditing, setIsEditing] = useState(false)
    const [isEditingDisabled, setIsEditingDisabled] = useState(false)
    const board = useBoundStore(useShallow((state) => state.boardData))
    const [value, setValue] = useState(board?.name || '')
    const user = useBoundStore(useShallow((state) => state.userData))
    const inputRef = useRef<HTMLInputElement>(null)
    const isDisconnected = useBoundStore(useShallow((state) => state.isDisconnected))

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

    const saveName = async () => {
        if (value.trim() === "") {
            toast.error('Name cannot be empty')
            setIsEditing(false)
            return
        }
        setIsEditing(false)
        if (value !== board.name) {
            const oldName = board.name
            useBoundStore.setState({
                boardData: {
                    ...board,
                    name: value
                }
            })
            setIsEditingDisabled(true)
            const toastId = toast.loading('Saving...')
            const boardNameService = engine.getService<BoardNameService>("boardName")
            try {
                const message = await boardNameService.changeBoardName(value, board.id)

                if (message.error) {
                    toast.error(`Failed to saved: ${message.error.message}`, { id: toastId })
                    console.error('[changeBoardName] Failed to save', message.error, message.error.code)
                } else {
                    toast.success('Saved', { id: toastId })
                    useBoundStore.setState({
                        boardData: {
                            ...board,
                            name: message.changeBoardName?.name || value
                        }
                    })
                }
            } catch (er) {
                console.error(er)
                toast.error('Failed to save. Try again later')
                useBoundStore.setState({
                    boardData: {
                        ...board,
                        name: oldName
                    }
                })
            } finally {
                setIsEditingDisabled(false)
            }
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
                        <Button variant="ghost" size="sm" className="text-base font-bold" disabled={isDisconnected}>
                            <Link to={"/boards"}>
                                WB
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={10}>Home</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {
                board.owner_id === user.id && !isDisconnected ? (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={clsx("text-sm max-w-[300px]", {
                                        "border-2 border-solid border-blue-400": isEditing
                                    })}
                                    size="sm"
                                    disabled={isEditingDisabled}
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
                board.owner_id === user.id && isEditing && !isDisconnected  ? (
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