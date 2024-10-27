import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input"
import { buttonVariants } from "@/components/ui/button"
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form.tsx";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

export default function Login() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
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
                                            <Input placeholder="john_doe@icloud.com" {...field} />
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
                                            <Input placeholder="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="block w-full">Register</Button>
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