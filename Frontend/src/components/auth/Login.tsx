"use client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PasswordInput from "@/components/uiUtils/PasswordField";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { GoogleAuthApi, LoginApi } from "@/endPoints/auth.endPoints";
import { useUser } from '@/contextApis/UserContext';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

const Login = () => {
    const { toast } = useToast()
    type FormData = { email: string; password: string };
    const router = useRouter();
    const { setAuthData, setClinicDoctors} = useUser();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ mode: 'onChange' });

    const onLogin = async (data: FormData) => {
        LoginApi({ email: data.email, password: data.password })
            .then((response) => {
                console.log("Login Success", response.data);
                const user = response.data?.user;
                const tokens = response.data?.tokens || response.data?.data?.tokens || null;
                setAuthData({ user, tokens });
                if (!user?.user_type) {
                    router.push("/userType");
                } else if (user?.user_type === "patient") {
                    router.push("/profile");
                } else if (user?.user_type === "clinic") {
                    setClinicDoctors(response.data.user.clinic_doctors.doctors)
                    router.push("/clinicDashboard");
                } else if (user?.user_type === "doctor") {
                    if(user?.specialization == null){
                        router.push("/doctorRegistration");
                    }
                    else{
                         router.push("/doctorProfile");
                    }
                }
                toast({
                    title: "Success!",
                    description: "Login Successful",
                })
            })
            .catch((error) => {
                console.log("Login Failed", error);
                toast({
                    title: "Failed!",
                    description: "Login Failed",
                    variant: "destructive",
                })
            })
    }

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) return;
        (async () => {
            try {
                const response = await GoogleAuthApi({ code });
                const user = response.data?.user;
                const tokens = response.data?.tokens || response.data?.data?.tokens || null;
                setAuthData({ user, tokens });
                toast({
                    title: "Success!",
                    description: "Google login successful",
                })
                // Remove query params before navigating
                window.history.replaceState({}, document.title, window.location.pathname);
                if (!user?.user_type) {
                    router.push("/userType");
                } else {
                    router.push("/");
                }
            } catch (error) {
                toast({
                    title: "Failed!",
                    description: "Google login failed",
                    variant: "destructive",
                })
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                            <a href="#" onClick={() => { }} className="text-xs text-gray-500">Forget Password?</a>
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
                    <div className="mt-4">
                        <GoogleAuthButton />
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