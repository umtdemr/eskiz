import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";

export function InviteModal({
    isOpen = false,
    closeModal
}: {
    isOpen: true,
    closeModal: () => void
}) {
    return (
        <Dialog open={isOpen} onOpenChange={(newMode) => { if (!newMode) closeModal() }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Invite
                    </DialogTitle>
                    <DialogDescription>
                        You can invite other people to collaborate on this board with you
                    </DialogDescription>
                </DialogHeader>
                {/*todo: will be implemented*/}
            </DialogContent>
        </Dialog>
    )
}