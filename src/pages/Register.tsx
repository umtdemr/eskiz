import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button, buttonVariants} from "@/components/ui/button.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Link} from "react-router-dom";

export default function Register() {
    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Register
                </h1>
                <div>
                    <div className="grid w-full text-left max-w-sm gap-1.5 my-5">
                        <Label htmlFor="fullName" className={'text-sm font-light'}>Full name</Label>
                        <Input type="text" id="fullName" placeholder="Full name" />
                    </div>
                    <div className="grid w-full text-left max-w-sm gap-1.5 my-5">
                        <Label htmlFor="email" className={'text-sm font-light'}>Email</Label>
                        <Input type="email" id="email" placeholder="Email" />
                    </div>
                    <div className="grid w-full text-left max-w-sm gap-1.5 my-5">
                        <Label htmlFor="password" className={'text-sm font-light'}>Password</Label>
                        <Input type="password" id="password" placeholder="password" />
                    </div>
                </div>
                <Button>Register</Button>
                <span>
                    Don you have an account?  <Link to="/" className={buttonVariants({ variant: "outline" })}>Login</Link>
                </span>
            </div>
        </div>
    )
}