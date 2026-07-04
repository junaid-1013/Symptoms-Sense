"use client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import Loading from "@/components/Loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PasswordInput from "@/components/uiUtils/PasswordField";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { useUser } from '@/contextApis/UserContext';
import { RegisterApi } from "@/endPoints/auth.endPoints";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const Register = () => {
    const router = useRouter();
    const { setAuthData } = useUser();
    const { toast } = useToast()
    type FormData = { email: string; password: string; username: string; confirmPassword: string; phone: string };
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ mode: 'onChange' });
    const password = watch('password');

    const onRegister = async (data: FormData) => {
        setIsLoading(true);
        RegisterApi({ email: data.email, password: data.password, name: data.username, phone: data.phone })
            .then((response) => {
                const user = response.data?.user;
                const tokens = response.data?.tokens || response.data?.data?.tokens || null;
                setAuthData({ user, tokens });
                if (!user?.user_type) {
                    router.push("/userType");
                }else if (user?.user_type === "patient") {
                    router.push("/profile");
                } else if (user?.user_type === "clinic") {
                    router.push("/clinicDashboard");
                } else if (user?.user_type === "doctor") {
                    router.push("/doctorProfile");
                }
                toast({
                    title: "Success!",
                    description: "Signup Success.",
                })
            })
            .catch((error) => {
                const message =
                error?.response?.data?.detail || 
                error?.response?.data?.message || "Something went wrong";
                toast({
                    title: "Failed!",
                    description: message,
                    variant: "destructive",
                })
            })
            .finally(() => setIsLoading(false));
    }

    return (
        <div className="py-6">
            {/* Full-screen loader overlay while API call is in flight */}
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Loading />
                </div>
            )}
            <div className="flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-w-sm lg:max-w-4xl">
                <div className="w-full p-8 lg:w-1/2">
                    <div className="flex justify-center mb-2">
                        <Image
                            src="/logo-green.png"
                            alt="green logo"
                            height={1000}
                            width={1000}
                            className="w-36"
                        />

                    </div>
                    <p className="text-lg text-gray-500 text-center font-semibold">Hello! Welcome !</p>
                    <div className="mt-4">
                        <Label className="block text-gray-700 text-sm font-bold mb-2">Username</Label>
                        <Input
                            placeholder="Your name"
                            {...register('username', { required: 'Username is required' })}
                            className="bg-gray-100 text-gray-700"
                        />
                        {errors.username && (
                            <Label className="text-red-500 text-xs mt-1 block">{errors.username.message}</Label>
                        )}
                    </div>
                    <div className="mt-4">
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
                        <Label className="block text-gray-700 text-sm font-bold mb-2">Phone</Label>
                        <Input
                            type="tel"
                            placeholder="+1 555 123 4567"
                            {...register('phone', {
                                required: 'Phone number is required',
                                pattern: {
                                    value: /^[+()\-.\s\d]{7,20}$/,
                                    message: 'Enter a valid phone number',
                                },
                            })}
                            className="bg-gray-100 text-gray-700"
                        />
                        {errors.phone && (
                            <Label className="text-red-500 text-xs mt-1 block">{errors.phone.message}</Label>
                        )}
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between">
                            <Label className="block text-gray-700 text-sm font-bold mb-2">Password</Label>
                        </div>
                        <PasswordInput
                            register={register}
                            errors={errors}
                            showLabel={false}
                            inputClassName="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                        />
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between">
                            <Label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</Label>
                        </div>
                        <PasswordInput
                            register={(name: string, options: any) =>
                                register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) => value === password || 'Passwords do not match',
                                    ...options
                                })
                            }
                            errors={{ password: errors.confirmPassword }}
                            showLabel={false}
                            inputClassName="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                            passwordError={errors.confirmPassword?.message}
                        />
                    </div>
                    <div className="mt-8">
                        <form onSubmit={handleSubmit(onRegister)}>
                            <SpinnerButton state={isSubmitting} name="Sign Up" type="submit" className="bg-[#192a56] text-white font-bold w-full hover:bg-[#192a56]/75 disabled:opacity-50 disabled:cursor-not-allowed" />
                        </form>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-x-2">
                        <span className="border-b w-full"></span>
                        <p className="text-xs text-center text-gray-500 uppercase">or</p>
                        <span className="border-b w-full"></span>
                    </div>
                    <div className="mt-4">
                        <GoogleAuthButton />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-x-2">
                        <p className="text-xs text-gray-500">Already have an account?</p>
                        <Link href="/login" className="text-xs text-[#192a56] uppercase hover:underline">Sign In</Link>
                    </div>
                </div>
                <div className="hidden lg:block lg:w-1/2 object-contain pb-8" >
                    <Image
                        src='/registerImage.jpg'
                        alt="login page "
                        width={410}
                        height={430}
                    />
                </div>

            </div>
        </div>
    )
}

export default Register