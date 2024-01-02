"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadCloud } from "lucide-react";

const EditProfile = () => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const selectedFile = event.target.files[0];
            setImagePreview(URL.createObjectURL(selectedFile));
        }
    };


    return (
        <div className="p-4 sm:p-8 w-full sm:w-1/2 lg:w-1/3 mx-auto">
            <h1 className="text-2xl sm:text-3xl text-center my-6">Edit Profile</h1>
            <form className="flex flex-col gap-y-4">
                <Label className="text-base" >Profile Image:</Label>
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col rounded-full border-2 border-dashed w-60 h-60 group text-center cursor-pointer overflow-hidden">
                        {imagePreview ? (
                            <div className="flex h-64">
                                <img
                                    src={imagePreview}
                                    alt="Selected Image"
                                    className="relative object-cover"
                                />
                            </div>
                        ) : (
                            <div className="h-full w-full text-center flex flex-col items-center justify-center p-10">
                                <UploadCloud className="self-center h-32 w-32" />
                                <p className="text-gray-500 ">
                                    Drag and drop pic here
                                    <br /> or select a pic from your computer
                                </p>
                            </div>
                        )}
                        <input type="file" className="hidden" name="profile_image" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
                <Label className="text-base" >Name:</Label>
                <Input type="text" name="name" required placeholder="Name" className="placeholder:text-gray-400" />

                <button className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80">
                    Update Profile
                </button>
            </form>

            <div className="grid mt-4">
                <button className="py-3 text-base font-medium text-white rounded-lg bg-red-500 px-7 hover:bg-opacity-80">
                    Delete Profile
                </button>
            </div>
        </div>
    );
};

export default EditProfile;