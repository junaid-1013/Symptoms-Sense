"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { DoctorOnboardingApi } from "@/endPoints/doctor.endPoints";
import { RegisterDoctorApiProps } from "@/types";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { useUser } from "@/contextApis/UserContext";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { DOCTOR_SPECIALIZATIONS } from "@/config/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function AddDoctor() {
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<RegisterDoctorApiProps>();
  const [loading, setLoading] = useState(false);
  const { tokens, updateUserDetails} = useUser();
  const [bio, setBio] = useState("");

  const onAddDoctor = (data: RegisterDoctorApiProps) => {
    setLoading(true);
    DoctorOnboardingApi({
      specialization: data.specialization,
      license_no: data.license_no,
      experience_years: Number(data.experience_years),
      bio: bio,
      token: tokens?.accessToken || "",
    })
      .then((response) => {
        if(response){
          updateUserDetails({
          specialization: data.specialization,
          license_no: data.license_no,
          experience_years: Number(data.experience_years),
          bio: bio,
        });
          reset();
          setBio("");
          setLoading(false);
          toast({
          title: "Success!",
          description: "Doctor added successfully.",
        });
        }
      })
      .catch((error) => {
        toast({
          title: "Failed!",
          description: error.message || "Something went wrong.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)] bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-2xl p-8 border border-blue-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Doctor Registration</h2>

        <form onSubmit={handleSubmit(onAddDoctor)} className="space-y-4">
          {/* Specialization Dropdown */}
          <div>
            <Label>Specialization</Label>
            <Select
              onValueChange={(value) => setValue("specialization", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
               <SelectContent className="max-h-56 overflow-y-auto"> 
                {DOCTOR_SPECIALIZATIONS.map((specialization) => (
                  <SelectItem key={specialization} value={specialization}>
                    {specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialization && (
              <p className="text-red-500 text-sm mt-1">{errors.specialization.message}</p>
            )}
          </div>

          {/* License No */}
          <div>
            <Label>License Number</Label>
            <Input
              placeholder="Enter license number"
              {...register("license_no", { required: "License number is required" })}
            />
          </div>

          {/* Experience Years */}
          <div>
            <Label>Years of Experience</Label>
            <Input
              type="number"
              placeholder="e.g., 5"
              {...register("experience_years", {
                required: "Experience is required",
                min: { value: 0, message: "Must be positive" },
              })}
            />
          </div>

          {/* Bio */}
          <div>
            <Label>Bio</Label>
            <ReactQuill
              theme="snow"
              value={bio}
              onChange={setBio}
              placeholder="Write a short bio about the doctor..."
              className="h-40 mb-12"
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ["bold", "italic", "underline"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["clean"],
                ],
              }}
            />
          </div>
          {/* Submit Button */}
          <div className="pt-2">
            <SpinnerButton type="submit" state={loading} name="Register" className="w-full" />
          </div>
        </form>
      </div>
    </div>
  );
}
