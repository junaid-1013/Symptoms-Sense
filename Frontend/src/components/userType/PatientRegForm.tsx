"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { RegisterPatientApi } from "@/endPoints/patient.endPoints";
import { GENDERS, BLOOD_GROUPS } from "@/config/constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contextApis/UserContext"; 

interface FormData {
  age: number;
  gender: string;
  blood_group: string;
  emergency_contact: string;
  address: string;
}

export default function PatientRegForm() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { tokens, updateUserType } = useUser(); 

  const onRegister = (data: FormData) => {
    if (!tokens?.accessToken) {
      toast({
        title: "Unauthorized",
        description: "Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    RegisterPatientApi({
      age: Number(data.age),
      gender: data.gender,
      blood_group: data.blood_group,
      emergency_contact: data.emergency_contact,
      address: data.address,
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNzllZTI2Ny1mNzNjLTRmMGEtOGNjMi04NzY5ZDczYzc5ODMiLCJlbWFpbCI6Imh1bWVyYWFrbWFsMjAwMUBnbWFpbC5jb20iLCJleHAiOjE3NjE0ODg3MDYsInR5cGUiOiJhY2Nlc3MifQ.sp9O7H5r284Kx27kTXteC0m4FF3kNOzq204u5eZRMvE"
    })
      .then((response) => {
        console.log("Patient Registered:", response.data);
        toast({
          title: "Success!",
          description: "Patient registered successfully.",
        });
        router.push("/");
      })
      .catch((error) => {
        console.error("Registration Failed:", error);
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
      <h2 className="text-2xl font-bold mb-6 text-center">Register as Patient</h2>
      <form onSubmit={handleSubmit(onRegister)} className="space-y-5">
        
        {/* Age */}
        <div>
          <Label>Age</Label>
          <Input
            type="number"
            placeholder="Enter your age"
            {...register("age", {
              required: "Age is required",
              valueAsNumber: true,
              min: { value: 1, message: "Age must be at least 1" },
              max: { value: 120, message: "Age seems invalid" },
            })}
          />
          {errors.age && <p className="text-red-500 text-sm">{errors.age.message}</p>}
        </div>

        {/* Gender */}
        <div>
          <Label>Gender</Label>
          <Select onValueChange={(value) => setValue("gender", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
        </div>

        {/* Blood Group */}
        <div>
          <Label>Blood Group</Label>
          <Select onValueChange={(value) => setValue("blood_group", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.blood_group && <p className="text-red-500 text-sm">{errors.blood_group.message}</p>}
        </div>

        {/* Emergency Contact */}
        <div>
          <Label>Emergency Contact</Label>
          <Input
            type="tel"
            placeholder="Enter emergency contact"
            {...register("emergency_contact", {
              required: "Contact number is required",
              pattern: {
                value: /^[0-9]{10,15}$/,
                message: "Enter a valid contact number (10–15 digits)",
              },
            })}
          />
          {errors.emergency_contact && <p className="text-red-500 text-sm">{errors.emergency_contact.message}</p>}
        </div>

        {/* Address */}
        <div>
          <Label>Address</Label>
          <Input
            placeholder="Enter your address"
            {...register("address", { required: "Address is required" })}
          />
          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
        </div>

        {/* Submit Button with Spinner */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>
    </div>
  );
}
