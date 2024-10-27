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
} from "@/components/ui/form"
import {Link} from "react-router-dom";

import { z } from "zod"
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";

const formSchema = z.object({
    fullName: z.string().min(2, { message: "Full name must have minumum 2 characters" }).max(50, { message: "Full name must be less than 50 characters" }),
    email: z.string().email(),
    password: z.string()
        .min(8, { message: "Password must have minumum 8 characters" })
        .max(30, { message: "Password is too long. It must be less than 30 characters." })
})

export default function Register() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: ""
        }
    })
    
    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log('>> submit with', values)
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
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john doe" {...field} />
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
                                            <Input placeholder="john_doe@icloud.com" {...field} />
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
                                            <Input placeholder="password" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Your strong password.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="block w-full">Register</Button>
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