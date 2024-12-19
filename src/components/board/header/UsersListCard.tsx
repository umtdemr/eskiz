import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {X} from "lucide-react";
import {Avatar, AvatarFallback} from "@/components/ui/avatar.tsx";
import {Badge} from "@/components/ui/badge.tsx";

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
                <CardTitle className='flex items-center'>
                    Online users
                    <Badge className='rounded-full px-2 ml-3 bg-blue-900'>
                        { users.length }
                    </Badge>
                </CardTitle>
                <Button variant='secondary' className='absolute py-2 px-3 top-2 right-4 rounded-full'>
                    <X />
                </Button>
            </CardHeader>
            <CardContent className='grid gap-4 max-h-60 overflow-y-auto'>
                {
                    users.map((user, i) => (
                        <div className='flex justify-between items-center'>
                            <div className='flex gap-2'>
                                <Avatar>
                                    <AvatarFallback>{user.avatar}</AvatarFallback>
                                </Avatar>
                                <div className='grid'>
                                    <span>
                                        {user.name}
                                    </span>
                                    <span className='text-xs text-slate-500'>umitde296@gmail.com</span>
                                </div>
                            </div>
                            {
                                i === 0 ? (
                                    <Badge className='flex-shrink-5 h-6'>
                                        you
                                    </Badge>
                                ) : null
                            }
                        </div> 
                    ))
                }
            </CardContent>
        </Card>
    )
}