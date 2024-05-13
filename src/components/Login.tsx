"use client";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from '@/helpers/UserContext';
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
const Login = () => {
    const { toast } = useToast()
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();
    const [role, setRole] = useState('patient');
    const { user, setUser } = useUser();
    const [users, setUsers] = useState({
        email: "",
        password: "",
    })

    const onLogin = async () => {

        try {
            const data = {
                email: users.email,
                password: users.password,
                role: role

            }
            const response = await axios.post("/api/users/login", data);
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
                email: users.email,
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
                        <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                        <div className="flex mb-6">
                            <label className="flex items-center mr-4 cursor-pointer">
                                <input
                                    type="radio"
                                    value="patient"
                                    checked={role === 'patient'}
                                    onChange={() => setRole('patient')}
                                    className="mr-2 cursor-pointer"
                                />
                                <span className="text-sm">Patient</span>
                            </label>

                            <label className="flex items-center mr-4 cursor-pointer">
                                <input
                                    type="radio"
                                    value="doctor"
                                    checked={role === 'doctor'}
                                    onChange={() => setRole('doctor')}
                                    className="mr-2 cursor-pointer"
                                />
                                <span className="text-sm">Doctor</span>
                            </label>

                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    value="admin"
                                    checked={role === 'admin'}
                                    onChange={() => setRole('admin')}
                                    className="mr-2 cursor-pointer"
                                />
                                <span className="text-sm">Admin</span>
                            </label>
                        </div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            value={users.email}
                            onChange={(e) => setUsers({ ...users, email: e.target.value })}
                            className="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                            type="email" />
                    </div>
                    <div className="mt-4">
                        <div>
                            {role == 'admin' ? (<div className="flex justify-between">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>

                            </div>) : (
                                <div className="flex justify-between">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                    <a
                                        href="#"
                                        onClick={forgotPass}
                                        className="text-xs text-gray-500">Forget Password?</a>
                                </div>
                            )
                            }
                        </div>
                        <input
                            value={users.password}

                            onChange={(e) => setUsers({ ...users, password: e.target.value })}
                            className="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none "
                            type={
                                showPassword ? "text" : "password"
                            }
                        />
                        <br />
                        <label onClick={() => { setShowPassword(!showPassword) }} className="cursor-pointer hover:underline hover:underline-offset-2">
                            Show Password
                        </label>
                    </div>
                    <div className="mt-8">
                        <button
                            onClick={onLogin}
                            className="bg-[#192a56] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#192a56]/75">
                            Login
                        </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-x-2">
                        <span className="border-b w-full"></span>
                        <p className="text-xs text-center text-gray-500 uppercase">or</p>
                        <span className="border-b w-full"></span>
                    </div>
                    {/*
                    <div className="flex items-center justify-center gap-x-4 mt-4">
                        <Link href="#" className="text-white rounded-lg shadow-md hover:bg-gray-100">
                            <div className="px-4 py-3">
                                <Image
                                    src="/google.svg"
                                    alt="google logo"
                                    width={1000}
                                    height={1000}
                                    className="h-5 w-5"
                                />
                            </div>
                        </Link>
                        <Link href="#" className="text-white rounded-lg shadow-md hover:bg-gray-100">
                            <div className="px-4 py-3">
                                <Image
                                    src="/facebook.svg"
                                    alt="facebook logo"
                                    width={1000}
                                    height={1000}
                                    className="h-5 w-5"
                                />
                            </div>
                        </Link>
                        <Link href="#" className="text-white rounded-lg shadow-md hover:bg-gray-100">
                            <div className="px-4 py-3">
                                <Image
                                    src="/apple.svg"
                                    alt="apple logo"
                                    width={1000}
                                    height={1000}
                                    className="h-5 w-5"
                                />
                            </div>
                        </Link>

                    </div>
    */}
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