"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import PasswordInput from "@/components/uiUtils/PasswordField";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { useUser } from '@/helpers/UserContext';
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const Login = () => {
    const { toast } = useToast()
    type FormData = { email: string; password: string };
    const router = useRouter();
    const [role, setRole] = useState('patient');
    const { user, setUser } = useUser();
    const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({ mode: 'onChange' });

    const onLogin = async (data: FormData) => {

        try {
            const payload = { ...data, role };
            const response = await axios.post("/api/users/login", payload);
            router.push("/");
            window.location.reload();
            console.log("Login Success", response.data);

            setUser({ username: 'exampleUser' });
            toast({
                title: "Success!",
                description: "Sign in Successful",
            })

        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.error) {
                toast({
                    title: "Failed!",
                    description: error.response.data.error,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Failed!",
                    description: "An error occurred during Login.",
                    variant: "destructive",
                })
            }
        } finally {

        }
    }
    const forgotPass = async () => {
        try {
            const { protocol, host } = window.location;
            const url = `${protocol}//${host}`;
            const data = {
                email: getValues('email'),
                url: url,
                role: role
            }
            const response = await axios.post("/api/forgot_password", data);
            toast({
                title: "Success!",
                description: "An email containing the link to reset your password has been dispatched to your inbox.",
            })

        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.error) {
                toast({
                    title: "Failed!",
                    description: error.response.data.error,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Failed!",
                    description: "An error occurred .",
                    variant: "destructive",
                })
            }
        } finally {

        }
    }

    return (
        <div className="py-6">
            <div className="flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-w-sm lg:max-w-4xl">
                <div className="w-full p-8 lg:w-1/2">
                    <div className="flex justify-center mb-2 ">
                        <Image
                            src="/logo-green.png"
                            alt="green logo"
                            height={1000}
                            width={1000}
                            className="w-36"
                        />
                    </div>
                    <p className="text-lg text-gray-500 text-center font-semibold">Hello! Welcome back!</p>
                    <div className="mt-4">
                        <Label className="block text-gray-700 text-sm font-bold mb-2">Role</Label>
                        <RadioGroup value={role} onValueChange={setRole} className="flex mb-6 gap-x-6">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="patient" id="r-patient" />
                                <Label htmlFor="r-patient" className="text-sm">Patient</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="doctor" id="r-doctor" />
                                <Label htmlFor="r-doctor" className="text-sm">Doctor</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="admin" id="r-admin" />
                                <Label htmlFor="r-admin" className="text-sm">Admin</Label>
                            </div>
                        </RadioGroup>
                        <Label className="block text-gray-700 text-sm font-bold mb-2">Email</Label>
                        <Input
                            type="email"
                            placeholder="you@example.com"
                            {...register('email', { required: 'Email is required' })}
                            className="bg-gray-100 text-gray-700"
                        />
                        {errors.email && (
                            <Label className="text-red-500 text-xs mt-1 block">{errors.email.message}</Label>
                        )}
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between">
                            <Label className="block text-gray-700 text-sm font-bold mb-2">Password</Label>
                            {role !== 'admin' && (
                                <a href="#" onClick={forgotPass} className="text-xs text-gray-500">Forget Password?</a>
                            )}
                        </div>
                        <PasswordInput
                            register={register}
                            errors={errors}
                            showLabel={false}
                            inputClassName="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                        />
                    </div>
                    <div className="mt-8">
                        <form onSubmit={handleSubmit(onLogin)}>
                            <SpinnerButton state={isSubmitting} name="Login" type="submit" className="bg-[#192a56] text-white font-bold w-full hover:bg-[#192a56]/75" />
                        </form>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-x-2">
                        <span className="border-b w-full"></span>
                        <p className="text-xs text-center text-gray-500 uppercase">or</p>
                        <span className="border-b w-full"></span>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-x-2">
                        <p className="text-xs text-gray-500">Do not have an account?</p>
                        <Link href="/register" className="text-xs text-[#192a56] uppercase hover:underline">Sign up</Link>
                    </div>
                </div>
                <div className="hidden lg:block lg:w-1/2 object-contain pb-8">
                    <Image
                        src='/loginImage.jpg'
                        alt="login page "
                        width={1000}
                        height={1000}
                    />
                </div>
            </div>
        </div>
    )
}

export default Login