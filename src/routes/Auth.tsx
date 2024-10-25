import {Button} from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export default function Auth() {
    return (
        <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    WB
                </div>
                <div className="z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;Just another collaboration app&rdquo;
                        </p>
                        <footer className="text-sm">Ümit Demir</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Create an account
                        </h1>
                        <div>
                            <div className="grid w-full text-left max-w-sm gap-1.5 my-5">
                                <Label htmlFor="fullName" className={'text-sm font-light'}>Full Name</Label>
                                <Input type="text" id="fullName" placeholder="Email" />
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
                        <Button>Sign up</Button>
                    </div>
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        By clicking continue, you agree to our terms of conditions.
                    </p>
                </div>
            </div>
        </div>
    )
}