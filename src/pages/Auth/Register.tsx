import {Input} from "@/components/ui/input.tsx";
import {Button, buttonVariants} from "@/components/ui/button.tsx";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form.tsx"
import { Link, useNavigate } from "react-router-dom";

import { z } from "zod"
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {DefaultError, useMutation} from "@tanstack/react-query";
import {RegisterRequest} from "@/types/Auth.ts";
import {API_ENDPOINTS} from "@/helpers/Constant.ts";
import {LoaderCircle} from "lucide-react";
import { toast } from "react-hot-toast"

const formSchema = z.object({
    full_name: z.string().min(2, { message: "Full name must have minumum 2 characters" }).max(50, { message: "Full name must be less than 50 characters" }),
    email: z.string().email(),
    password: z.string()
        .min(8, { message: "Password must have minimum 8 characters" })
        .max(72, { message: "Password is too long. It must be less than 72 characters." }),
    api: z.any()
})

export default function Register() {
    const navigate = useNavigate();
    
    const mutation = useMutation<unknown, DefaultError, RegisterRequest>({
        mutationFn: (formData) => {
            return fetch(API_ENDPOINTS.REGISTER, {
                method: "POST",
                body: JSON.stringify(formData)
            })
        },
        onSuccess: async data => {
            let resp;
            try {
               resp = await data.json() 
            } catch (err) {
                console.error(err)
                form.setError("api", { type: "custom", message: "unknown error" })
                return
            }
            if (data.status === 400) {
                if (resp.error) {
                    if (resp.error.full_name) {
                        form.setError("full_name", { type: "custom", message: resp.error.full_name })
                    }
                    if (resp.error.email) {
                        form.setError("email", { type: "custom", message: resp.error.email })
                    }
                    if (resp.error.password) {
                        form.setError("password", { type: "custom", message: resp.error.password })
                    }
                    if (typeof resp.error === 'string') form.setError("api", { type: "custom", message: resp.error })
                }
                return
            }
            
            if (data.status === 201) {
                navigate('/')
                toast.success("You have successfully registered")
            }
        },
        onError: () => {
            form.setError("api", { type: "custom", message: "could not login: unknown error. please try again later." })
        }
    })
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: ""
        }
    })
    
    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate({...values})
    }
    
    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-center">
                    Register
                </h1>
                <div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john doe" {...field} disabled={mutation.isPending} />
                                        </FormControl>
                                        <FormDescription>
                                            This is your public display name.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john_doe@icloud.com" {...field} disabled={mutation.isPending} />
                                        </FormControl>
                                        <FormDescription>
                                            Your email address.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="password" {...field} disabled={mutation.isPending} />
                                        </FormControl>
                                        <FormDescription>
                                            Your strong password.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.formState.errors.api ? <p className="text-[0.8rem] font-medium text-destructive">
                                {form.formState.errors.api.message}
                            </p> : null}
                            
                            <Button type="submit" className="w-full flex" disabled={mutation.isPending}>
                                { mutation.isPending ? <LoaderCircle className="animate-spin" /> : null }
                                Register
                            </Button>
                        </form>
                    </Form>
                </div>
                <span className="text-right py-10">
                    Do you have an account?  <Link to="/" className={buttonVariants({ variant: "outline" })}>Login</Link>
                </span>
            </div>
        </div>
    )
}