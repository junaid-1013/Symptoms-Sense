"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"
import Link from "next/link"
import axios from "axios";
import Swal from 'sweetalert2';
const Login = () => {
    const router = useRouter();
    const [user, setUser] = useState({
        email: "",
        password: "",
    })

    const onLogin = async () => {
        try {
            const response = await axios.post("/api/users/login", user);
            console.log("Login Success", response.data);
            router.push("/#");
            Swal.fire('Success!', 'Sign in Successful', 'success');

        } catch (error: any) {
            Swal.fire('Failed!', 'Invalid Username or Password', 'error');
        } finally {

        }
    }

    return (
        <div className="py-6">
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
                    <p className="text-lg text-gray-500 text-center font-semibold">Hellow! Welcome back!</p>
                    <div className="mt-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            value={user.email}
                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                            className="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                            type="email" />
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            <a href="#" className="text-xs text-gray-500">Forget Password?</a>
                        </div>
                        <input
                            value={user.password}
                            onChange={(e) => setUser({ ...user, password: e.target.value })}
                            className="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                            type="password"
                        />
                    </div>
                    <div className="mt-8">
                        <button
                            onClick={onLogin}
                            className="bg-green-600 text-white font-bold py-2 px-4 w-full rounded hover:bg-green-600/75">
                            Login
                        </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-x-2">
                        <span className="border-b w-full"></span>
                        <p className="text-xs text-center text-gray-500 uppercase">or</p>
                        <span className="border-b w-full"></span>
                    </div>
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

                    <div className="mt-4 flex items-center justify-center gap-x-2">
                        <p className="text-xs text-gray-500">Do not have an account?</p>
                        <Link href="/register" className="text-xs text-green-600 uppercase hover:underline">Sign up</Link>
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