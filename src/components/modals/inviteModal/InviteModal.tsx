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
import {DefaultError, useMutation} from "@tanstack/react-query";
import {API_ENDPOINTS} from "@/helpers/Constant.ts";
import {InviteRequest} from "@/types/Board.ts";
import {useBoundStore} from "@/store/store.ts";
import {useShallow} from "zustand/react/shallow";
import {toast} from "react-hot-toast";
import {BoardUser} from "@/store/boards.ts";
import {getAvatar} from "@/helpers/AuthHelper.ts";

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
    const thisUser = useBoundStore(useShallow((state) => state.userData))
    const boardData = useBoundStore(useShallow(state => state.boardData))
    const users = useBoundStore(useShallow(state => state.users))
    const token = useBoundStore(useShallow((state) => state.token))
    const addToUsers = useBoundStore(useShallow((state) => state.addToUsers))

    const mutation = useMutation<unknown, DefaultError, InviteRequest>({
        mutationFn: (formData) => {
            return fetch(API_ENDPOINTS.INVITE_TO_BOARD, {
                method: 'POST',
                body: JSON.stringify(formData),
                credentials: 'omit',
                mode: 'cors',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        },
        onSuccess: async (resp) => {
            if (resp.status !== 201) {
                return Promise.reject('could not invite the user')
            }
            const data = await resp.json()
            if (!data.user || !data.user?.id < 0) {
                return Promise.reject('cold not invite the user')
            }
            
            // add to users slice
            addToUsers([{ 
                full_name: data.user.full_name,
                email: data.user.email,
                role: "editor",
                id: data.user.id,
                avatar: getAvatar(data.user.full_name)
            }] as BoardUser[])

            toast.success('Successfully invited.')
            
            // clear form
            form.reset()
        },
        onError: () => {
            toast.error('Could not invite the user. Please try again later')
        }
    })

    const form = useForm<z.infer<typeof inviteFormSchema>>({
        resolver: zodResolver(inviteFormSchema),
        defaultValues: {
            email: ""
        }
    })
    
    function onSubmit(values: z.infer<typeof inviteFormSchema>) {
        mutation.mutate({ email: values.email, board_id: boardData.id })
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={(newMode) => { if (mutation.isPending) return; if (!newMode) closeModal() }}>
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
                                    disabled={mutation.isPending}
                                    type='submit'>
                                    {  
                                        mutation.isPending ? <LoaderCircle className="animate-spin" /> : null
                                    }
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
                                        {user.full_name}
                                    </span>
                                        <span className='text-xs text-slate-500'>{user.email}</span>
                                    </div>
                                </div>
                                {
                                    user.email === thisUser.email ? (
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