import { UsersListDropdown } from '@/components/board/header/UsersListDropdown.tsx'
import { UsersListCard } from '@/components/board/header/UsersListCard.tsx'
import { useBoundStore } from '@/store/store.ts'
import { useShallow } from 'zustand/react/shallow'
import { InviteModal } from '@/components/modals/inviteModal/InviteModal.tsx'
import { useCallback } from 'react'
import { BoardName } from '@/components/board/header/BoardName.tsx'
import { Engine } from '@/core/engine/Engine.ts'

export default function Header({ engine }: { engine: Engine }) {
    const activeWindow = useBoundStore(
        useShallow((state) => state.activeWindow),
    )
    const openWindow = useBoundStore(useShallow((state) => state.openWindow))
    const isUsersListCardActive = activeWindow === 'online_users_list'
    const isInviteModalActive = activeWindow === 'invite'
    const isDisconnected = useBoundStore(
        useShallow((state) => state.isDisconnected),
    )

    const closeInviteModal = useCallback(() => {
        if (!isInviteModalActive) {
            return
        }

        openWindow(null)
    }, [isInviteModalActive, openWindow])

    return (
        <>
            <div className="fixed top-5 left-5" id="header_left">
                <BoardName engine={engine} />
            </div>
            {!isDisconnected ? (
                <>
                    <div className="fixed top-5 right-5 flex bg-white shadow px-2 py-2 rounded-xl h-12 items-center gap-2">
                        <UsersListDropdown />
                        {isUsersListCardActive ? <UsersListCard /> : null}
                    </div>
                    {isInviteModalActive ? (
                        <InviteModal
                            isOpen={true}
                            closeModal={closeInviteModal}
                        />
                    ) : null}
                </>
            ) : null}
        </>
    )
}
