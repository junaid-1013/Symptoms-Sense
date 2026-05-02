"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { DOCTOR_SPECIALIZATIONS } from "@/config/constants";
import { useUser } from "@/contextApis/UserContext";
import { DoctorOnboardingApi } from "@/endPoints/doctor.endPoints";
import { Plus, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface DoctorFormData {
  license_no: string;
  experience_years: number;
  specializations: { value: string }[];
  services: { value: string }[];
  education: { value: string }[];
  experience: { value: string }[];
  bio: string;
}

export default function AddDoctor() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch
  } = useForm<DoctorFormData>({
    defaultValues: {
      specializations: [],
      services: [],
      education: [],
      experience: [],
      bio: ""
    }
  });

  const [loading, setLoading] = useState(false);
  const { tokens, updateUserDetails } = useUser();
  const router = useRouter();

  // useFieldArray for dynamic fields
  const { fields: specializationFields, append: appendSpecialization, remove: removeSpecialization } =
    useFieldArray({ control, name: "specializations" });

  const { fields: serviceFields, append: appendService, remove: removeService } =
    useFieldArray({ control, name: "services" });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } =
    useFieldArray({ control, name: "education" });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } =
    useFieldArray({ control, name: "experience" });

  // Temporary input states for adding new items
  const [tempSpecialization, setTempSpecialization] = useState("");
  const [tempService, setTempService] = useState("");
  const [tempEducation, setTempEducation] = useState("");
  const [tempExperience, setTempExperience] = useState("");

  // Handle adding items
  const handleAddSpecialization = () => {
    if (tempSpecialization && !specializationFields.some(field => field.value === tempSpecialization)) {
      appendSpecialization({ value: tempSpecialization });
      setTempSpecialization("");
    }
  };

  const handleAddService = () => {
    if (tempService.trim()) {
      appendService({ value: tempService.trim() });
      setTempService("");
    }
  };

  const handleAddEducation = () => {
    if (tempEducation.trim()) {
      appendEducation({ value: tempEducation.trim() });
      setTempEducation("");
    }
  };

  const handleAddExperience = () => {
    if (tempExperience.trim()) {
      appendExperience({ value: tempExperience.trim() });
      setTempExperience("");
    }
  };

  const onAddDoctor = (data: DoctorFormData) => {
    // Validation for required array fields
    if (data.specializations.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one specialization",
        variant: "destructive",
      });
      return;
    }

    if (data.education.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one education entry",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Transform data for API
    const apiData = {
      specializations: data.specializations.map(s => s.value),
      services: data.services.map(s => s.value),
      education: data.education.map(e => e.value),
      experience: data.experience.map(e => e.value),
      license_no: data.license_no,
      experience_years: Number(data.experience_years),
      bio: data.bio,
      token: tokens?.accessToken || "",
    };

    DoctorOnboardingApi(apiData)
      .then((response) => {
        if (response) {
          updateUserDetails({
            specializations: apiData.specializations,
            license_no: apiData.license_no,
            experience_years: apiData.experience_years,
            bio: apiData.bio,
            services: apiData.services,
            education: apiData.education,
            experience: apiData.experience,
          });
          reset();
          setLoading(false);
          toast({
            title: "Success!",
            description: "Doctor registered successfully.",
          });
          router.push("/doctorProfile");
        }
      })
      .catch((error) => {
        const message =
                error?.response?.data?.detail || 
                error?.response?.data?.message || "Something went wrong";
        toast({
          title: "Failed!",
          description: message,
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)] bg-gray-50 px-4 py-8">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-2xl p-8 border border-blue-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Doctor Registration</h2>

        <form onSubmit={handleSubmit(onAddDoctor)} className="space-y-6">
          {/* Multiple Specializations */}
          <div>
            <Label className="text-base font-medium">Specializations *</Label>
            <div className="flex gap-2 mt-2">
              <Select
                value={tempSpecialization}
                onValueChange={setTempSpecialization}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent className="max-h-56 overflow-y-auto">
                  {DOCTOR_SPECIALIZATIONS.filter(
                    (spec) => !specializationFields.some(field => field.value === spec)
                  ).map((specialization) => (
                    <SelectItem key={specialization} value={specialization}>
                      {specialization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAddSpecialization} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {specializationFields.map((field, index) => (
                <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                  {field.value}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeSpecialization(index)}
                  />
                </Badge>
              ))}
            </div>
            {specializationFields.length === 0 && (
              <p className="text-red-500 text-sm mt-1">At least one specialization is required</p>
            )}
          </div>

          {/* License No */}
          <div>
            <Label className="text-base font-medium">License Number *</Label>
            <Input
              className="mt-2"
              placeholder="Enter license number"
              {...register("license_no", {
                required: "License number is required",
                minLength: {
                  value: 3,
                  message: "License number must be at least 3 characters"
                }
              })}
            />
            {errors.license_no && (
              <p className="text-red-500 text-sm mt-1">{errors.license_no.message}</p>
            )}
          </div>

          {/* Experience Years */}
          <div>
            <Label className="text-base font-medium">Total Years of Experience *</Label>
            <Input
              className="mt-2"
              type="number"
              placeholder="e.g., 5"
              {...register("experience_years", {
                required: "Experience is required",
                min: { value: 0, message: "Must be 0 or positive" },
                max: { value: 70, message: "Must be less than 70 years" },
                valueAsNumber: true
              })}
            />
            {errors.experience_years && (
              <p className="text-red-500 text-sm mt-1">{errors.experience_years.message}</p>
            )}
          </div>

          {/* Services Offered */}
          <div>
            <Label className="text-base font-medium">Services Offered</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="e.g., General Consultation, Surgery"
                value={tempService}
                onChange={(e) => setTempService(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddService();
                  }
                }}
              />
              <Button type="button" onClick={handleAddService} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {serviceFields.map((field, index) => (
                <Badge key={field.id} variant="outline" className="flex items-center gap-1">
                  {field.value}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeService(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Education */}
          <div >
            <Label className="text-base font-medium">Education *</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="e.g., MBBS - XYZ University (2015)"
                value={tempEducation}
                onChange={(e) => setTempEducation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddEducation();
                  }
                }}
              />
              <Button type="button" onClick={handleAddEducation} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 mt-3">
              {educationFields.map((field, index) => (
                <div key={field.id} className="flex justify-between items-center w-full gap-2">
                  <div
                    className="flex w-full bg-white px-3 py-2.5 rounded-md border"
                  >
                    <Label>{field.value}</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeEducation(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {educationFields.length === 0 && (
              <p className="text-red-500 text-sm mt-2">At least one education entry is required</p>
            )}
          </div>

          {/* Experience Details */}
          <div>
            <Label className="text-base font-medium">Experience Details</Label>
            <p className="text-sm text-gray-600 mt-1 mb-3">e.g., Senior Surgeon at ABC Hospital (2018-2023)</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter experience details"
                value={tempExperience}
                onChange={(e) => setTempExperience(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExperience();
                  }
                }}
              />
              <Button type="button" onClick={handleAddExperience} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 mt-3">
              {experienceFields.map((field, index) => (
                <div key={field.id} className="flex justify-between items-center w-full gap-2">
                  <div
                    className="flex w-full bg-white px-3 py-2.5 rounded-md border"
                  >
                    <Label>{field.value}</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeExperience(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label className="text-base font-medium">Bio</Label>
            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <ReactQuill
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write a short bio about the doctor..."
                  className="h-40 mb-12 mt-2"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["clean"],
                    ],
                  }}
                />
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <SpinnerButton type="submit" state={loading} name="Register Doctor" className="w-full" />
          </div>
        </form>
      </div>
    </div>
  );
}