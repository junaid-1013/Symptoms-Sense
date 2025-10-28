"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterClientApi } from "@/endPoints/clinic.endPoints"; 
import { useUser } from "@/contextApis/UserContext";
import { allowOnlyNumbers } from "../utils/Functions";
import { RegisterClinicApiProps } from "@/types";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";

export default function ClinicRegForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterClinicApiProps>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { tokens, updateUserType , setClinicId} = useUser();

  const onRegister = (data: RegisterClinicApiProps) => {
    if (!tokens?.accessToken) {
      toast({
        title: "Unauthorized",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    RegisterClientApi({
      address: data.address,
      registration_no: data.registration_no,
      established_year: Number(data.established_year),
      total_doctors: Number(data.total_doctors),
      token: tokens.accessToken,
    })
      .then((response) => {
        toast({
          title: "Success!",
          description: "Clinic registered successfully.",
        });
        updateUserType(response.data.user_type);
        setClinicId(response.data.id);
        router.push("/clinicDashboard");
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
    <div className="w-full max-w-md bg-card shadow-lg rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Register as Clinic</h2>
      <form onSubmit={handleSubmit(onRegister)} className="space-y-5">
        
        {/* Address */}
        <div>
          <Label>Clinic Address</Label>
          <Input
            placeholder="Enter clinic address"
            {...register("address", { required: "Address is required" })}
          />
          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
        </div>

        {/* Registration No */}
        <div>
          <Label>Registration Number</Label>
          <Input
            placeholder="Enter registration number"
            {...register("registration_no", { required: "Registration number is required" })}
            onKeyDown={allowOnlyNumbers}
          />
          {errors.registration_no && <p className="text-red-500 text-sm">{errors.registration_no.message}</p>}
        </div>

        {/* Established Year */}
        <div>
          <Label>Established Year</Label>
          <Input
            type="number"
            placeholder="e.g., 2010"
            {...register("established_year", {
              required: "Established year is required",
              min: { value: 1800, message: "Year seems invalid" },
              max: { value: new Date().getFullYear(), message: "Year cannot be in future" },
            })}
            onKeyDown={allowOnlyNumbers}
          />
          {errors.established_year && <p className="text-red-500 text-sm">{errors.established_year.message}</p>}
        </div>

        {/* Total Doctors */}
        <div>
          <Label>Total Doctors</Label>
          <Input
            type="number"
            placeholder="Enter total number of doctors"
            {...register("total_doctors", {
              required: "Total doctors count is required",
              min: { value: 1, message: "At least one doctor required" },
            })}
            onKeyDown={allowOnlyNumbers}
          />
          {errors.total_doctors && <p className="text-red-500 text-sm">{errors.total_doctors.message}</p>}
        </div>

        {/* Submit Button */}
              <SpinnerButton
                  type="submit"
                  state={loading}
                  name="Register"
                  className="w-full"
                />
      </form>
    </div>
  );
}
