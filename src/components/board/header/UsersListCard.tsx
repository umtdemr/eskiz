import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {X} from "lucide-react";
import {Avatar, AvatarFallback} from "@/components/ui/avatar.tsx";

export function UsersListCard({
    users
}: {
    users: {
        avatar: string,
            name: string
    }[]
}) {
    return (
        <Card className='fixed top-20 right-32 w-80'>
            <CardHeader className='relative'>
                <CardTitle>Online users</CardTitle>
                <Button variant='secondary' className='absolute py-2 px-3 top-2 right-4 rounded-full'>
                    <X />
                </Button>
            </CardHeader>
            <CardContent className='grid gap-4 max-h-60 overflow-y-auto'>
                {
                    users.map((user, i) => (
                        <div className='flex'>
                            <div className='flex gap-2'>
                                <Avatar>
                                    <AvatarFallback>{user.avatar}</AvatarFallback>
                                </Avatar>
                                <div className='grid'>
                                    <span>{user.name}</span>
                                    <span className='text-xs text-slate-500'>umitde296@gmail.com</span>
                                </div>
                            </div>
                        </div> 
                    ))
                }
            </CardContent>
        </Card>
    )
}