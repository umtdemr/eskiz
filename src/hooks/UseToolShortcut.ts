import { useEffect } from 'react'
import { Engine } from '@/core/engine/Engine'
import { Commands } from '@/core/command/CommandRegistry'
import { ACTION_MODES } from '@/helpers/Constant'
import { useBoundStore } from '@/store/store'

// opens a toolbar dropdown when a shortcut picks one of its tools and closes
// it when a shortcut picks another one
export default function useToolShortcut(
    engine: Engine,
    mode: keyof typeof ACTION_MODES,
    setIsOpen: (isOpen: boolean) => void,
) {
    useEffect(() => {
        const onExecuted = (name: Commands) => {
            if (name !== 'changeTool') return
            setIsOpen(useBoundStore.getState().mainMode === mode)
        }

        engine.commandExecuted.add(onExecuted)
        return () => {
            engine.commandExecuted.remove(onExecuted)
        }
    }, [engine, mode, setIsOpen])
}
