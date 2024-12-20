import {z} from "zod";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Button} from "@/components/ui/button.tsx";
import {LoaderCircle} from "lucide-react";
import {Avatar, AvatarFallback} from "@/components/ui/avatar.tsx";
import {Badge} from "@/components/ui/badge.tsx";

const inviteFormSchema = z.object({
    email: z.string().email(),
})

export function InviteModal({
    isOpen = false,
    closeModal
}: {
    isOpen: true,
    closeModal: () => void
}) {
    // this is dummy data
    const users = [
        {
            name: 'ümit demir',
            avatar: 'UD'
        },
        {
            name: 'ümit demir',
            avatar: 'KD'
        },
        {
            name: 'ümit demir',
            avatar: 'MD'
        },
        {
            name: 'ümit demir',
            avatar: 'TD'
        },
    ] 

    const form = useForm<z.infer<typeof inviteFormSchema>>({
        resolver: zodResolver(inviteFormSchema),
        defaultValues: {
            email: ""
        }
    })
    
    function onSubmit(values: z.infer<typeof inviteFormSchema>) {
        // todo: submit it
    }
    
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
                <div> {/*Invite form*/}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className='flex justify-between gap-5 items-center'>
                                <FormField
                                    control={form.control}
                                    name='email'
                                    render={({ field }) => {
                                        return (
                                            <FormItem className='w-full'>
                                                <FormControl>
                                                    <Input placeholder="Email" {...field}  />
                                                </FormControl>
                                            </FormItem>
                                        )}}
                                />
                                <Button
                                    className='bg-blue-700 hover:bg-blue-900'
                                    type='submit'>
                                    <LoaderCircle className="animate-spin" />
                                    Invite
                                </Button>
                            </div>
                            <div className='h-5'> { /* Avoid layout shifting on error message. */}
                                { form?.formState?.errors?.email ? (
                                   <span className='text-sm font-medium text-destructive'>{form.formState.errors.email.message}</span>
                                ) : null }
                            </div>
                        </form>
                    </Form>
                </div>
                <Separator />
                <div>
                    <h2 className='text-sm font-bold tracking-tight'>All members</h2>
                    <div className='grid gap-5 mt-5 max-h-60 overflow-y-auto'>
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
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}