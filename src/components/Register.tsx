"use client";
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from 'sweetalert2';
const Register = () => {
    const router = useRouter();
    const [user, setUser] = useState({
        email: "",
        password: "",
        username: "",
        image:""
    })
    const [img, setImage] = useState('/user.png');
    const handleImage = (e: any) => {
        const file = e.target.files[0];
        setFileToBase(file);
      }
    
      const setFileToBase = (file: any) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          setImage(reader.result as any);
          
        }
        
      }
    const onRegister = async () => {
        try {
            const user1={email:user.email,password:user.password,username:user.username,image:img}
           
            const response = await axios.post("/api/users/register", user1);
            console.log("Signup Success", response.data);

            router.push("/login");
            Swal.fire('Success!', 'Signup Success. Please Sign in..', 'success');
        } catch (error:any) {
            if (error.response && error.response.data && error.response.data.error) {
                Swal.fire('Failed!', error.response.data.error, 'error');
            } else {
                Swal.fire('Failed!', 'An error occurred during signup.', 'error');
            }
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
                    <p className="text-lg text-gray-500 text-center font-semibold">Hello! Welcome !</p>
                    {/*
                    <div className="flex items-center py-6">
                    <div className="w-40 h-40 mr-4 flex-none rounded-xl overflow-hidden">
                      <img
                        className="w-40 h-40 mr-4 object-cover"
                        src={img}
                        alt="Avatar Upload" />
                    </div>
                    <label className="cursor-pointer ">
                      <span className="focus:outline-none text-white text-sm py-2 px-4 rounded-full bg-[#273c75] hover:bg-opacity-80 hover:shadow-lg">Browse</span>
                      <input
                        type="file"
                        onChange={handleImage}
                        className="hidden"
                      />
                    </label>
                  </div>
    */}
                    <div className="mt-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                        <input
                            value={user.username}
                            onChange={(e) => setUser({ ...user, username: e.target.value })}
                            className="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                            type="text"
                        />
                    </div>
                    <div className="mt-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            value={user.email}
                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                            className="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                            type="email"
                        />
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                         {/*  <a href="#" className="text-xs text-gray-500">Forget Password?</a>*/}
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
                            onClick={onRegister}
                            className="bg-[#192a56] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#192a56]/75">
                            Sign Up
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
                        <p className="text-xs text-gray-500">Already have an account?</p>
                        <Link href="/login" className="text-xs text-[#192a56] uppercase hover:underline">Sign In</Link>
                    </div>
                </div>
                <div className="hidden lg:block lg:w-1/2 object-contain pb-8" >
               
                    <Image
                        src='/registerImage.jpg'
                        alt="login page "
                        width={370}
                        height={370}
                    />
                     <div className="flex mt-2 mr-20 justify-center">
                <Link
                    href="/doctorRegistration"
                    className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80"
                >
                    Register as a Doctor
                </Link>
            </div>
                </div>
                
            </div>
        </div>
    )
}

export default Register