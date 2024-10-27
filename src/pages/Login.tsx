import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input"
import { buttonVariants } from "@/components/ui/button"
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import { DefaultError, useMutation } from "@tanstack/react-query";
import { LoaderCircle } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form.tsx";
import {LoginRequest} from "@/types/Auth.ts";
import {API_ENDPOINTS} from "@/helpers/Constant.ts";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    api: z.any()
})

export default function Login() {
    const mutation = useMutation<unknown, DefaultError, LoginRequest>({
        mutationFn: (formData) => {
            return fetch(API_ENDPOINTS.LOGIN, {
                method: "POST",
                body: JSON.stringify(formData)
            })
        },
        onSuccess: data => {
            if (data.status === 401) {
                form.setError("password", { type: "custom", message: "Invalid credentials" })
                return
            }
            
            if (data.status === 201) {
                // TODO: SET AUTH TOKEN AND REDIRECT
                console.log('redirecting...')
            }
        },
        onError: () => {
            form.setError("api", { type: "custom", message: "could not login: unknown error. please try again later." })
        }
    })
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate({ email: values.email, password: values.password })
    }
    
    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-center">
                    Login
                </h1>
                <div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john_doe@icloud.com" {...field} disabled={mutation.isPending} />
                                        </FormControl>
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
                                            <Input placeholder="password" {...field} disabled={mutation.isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            {form.formState.errors.api ? <p className="text-[0.8rem] font-medium text-destructive">
                                {form.formState.errors.api.message}
                            </p> : null}
                            
                            <Button disabled={mutation.isPending} type="submit" className="w-full flex">
                                {
                                    mutation.isPending && <LoaderCircle className="animate-spin" />
                                }
                                Login
                            </Button>
                        </form>
                    </Form> 
                </div>
                <span className="text-right py-8">
                    Don't you have an account?  <Link to="/register" className={buttonVariants({ variant: "outline" })}>Register</Link>
                </span>
            </div>
        </div>
    )
}