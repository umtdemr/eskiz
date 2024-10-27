import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { buttonVariants } from "@/components/ui/button"


export default function Login() {
    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Login
                </h1>
                <div>
                    <div className="grid w-full text-left max-w-sm gap-1.5 my-5">
                        <Label htmlFor="email" className={'text-sm font-light'}>Email</Label>
                        <Input type="email" id="email" placeholder="Email" />
                    </div>
                    <div className="grid w-full text-left max-w-sm gap-1.5 my-5">
                        <Label htmlFor="password" className={'text-sm font-light'}>Password</Label>
                        <Input type="password" id="password" placeholder="password" />
                    </div>
                </div>
                <Button>Login</Button>
                <span>
                    Don't you have an account?  <Link to="/register" className={buttonVariants({ variant: "outline" })}>Register</Link>
                </span>
            </div>
        </div>
    )
}