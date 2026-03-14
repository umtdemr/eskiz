import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card.tsx'
import { Button } from '@/components/ui/button.tsx'
import { X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { useBoundStore } from '@/store/store.ts'

export function UsersListCard() {
    const closeAllWindows = useBoundStore((state) => state.closeAllWindows)
    const userData = useBoundStore((state) => state.userData)
    const collaborators = useBoundStore(
        (state) => state.collaboratorsList,
    ).filter((_, i) => i < 3)

    return (
        <Card className="fixed top-20 right-32 w-80">
            <CardHeader className="relative">
                <CardTitle className="flex items-center">
                    Online users
                    <Badge className="rounded-full px-2 ml-3 bg-blue-900">
                        {collaborators.length}
                    </Badge>
                </CardTitle>
                <Button
                    variant="secondary"
                    className="absolute py-2 px-3 top-2 right-4 rounded-full"
                    onClick={closeAllWindows}
                >
                    <X />
                </Button>
            </CardHeader>
            <CardContent className="grid gap-4 max-h-60 overflow-y-auto">
                {collaborators.map((user) => (
                    <div
                        className="flex justify-between items-center"
                        key={user.id}
                    >
                        <div className="flex gap-2">
                            <Avatar>
                                <AvatarFallback>{user.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="grid">
                                <span>{user.full_name}</span>
                                <span className="text-xs text-slate-500">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                        {user.email === userData.email ? (
                            <Badge className="flex-shrink-5 h-6">you</Badge>
                        ) : null}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
