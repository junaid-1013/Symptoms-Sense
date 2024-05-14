"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { DoctorRegistrationFormValues } from '@/types';
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

const DoctorProfileForm: React.FC = () => {

  const router = useRouter();
  const { toast } = useToast()
  const [image, setImage] = useState('/user.png');
  const [aboutCharCount, setAboutCharCount] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<DoctorRegistrationFormValues>();

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    setFileToBase(file);
    console.log(file);
  }

  const setFileToBase = (file: any) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImage(reader.result as any);
    }

  }
  const onSubmit: SubmitHandler<DoctorRegistrationFormValues> = (data) => {
    const onLogin = async () => {
      try {
        data.img = image;

        if (
          ((data.services ?? []).length === 0) || ((data.services ?? [])[0] == '')
        ) {
          throw new Error('Please provide atlease one service, then proceed to complete services 1 through 5 in sequential order');

        }
        else if (

          ((data.education ?? []).length === 0) || ((data.education ?? [])[0] == '')

        ) {
          throw new Error('Please provide atlease one education, then proceed to complete education 1 through 5 in sequential order');

        }
        else if (

          ((data.specialization ?? []).length === 0) || ((data.specialization ?? [])[0] == '')
        ) {
          throw new Error('Please provide atlease one specialization, then proceed to complete specialization 1 through 5 in sequential order');

        }
        else if (
          ((data.experienceDetails ?? []).length === 0) || ((data.experienceDetails ?? [])[0] == '')
        ) {
          throw new Error('Please enter atlease one Experience Detail, then proceed to complete 1 through 5 in sequential order');

        }

        const response = await axios.post("/api/regDoctor", data);
        const { protocol, host } = window.location;
        const url = `${protocol}//${host}`;
        const data1 = {
          email: data.email,
          url: url,
        }
        const res = await axios.post("/api/doctorPasswordSetup", data1);
        toast({
          title: "Success!",
          description: "Congratulations! You have successfully registered as a doctor. We have emailed you instructions to set up your password. To activate your account and gain access to your dashboard, please proceed to set up your password.",
        })
        router.push("/");

      } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
          toast({
            title: "Failed!",
            description: error.response.data.error,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Failed!",
            description: error.message,
            variant: "destructive"
          })
        }
      } finally {
      }
    }
    onLogin();
  };

  const handleServicesChange = (index: number, value: string) => {
    const services = getValues('services') || [];
    services[index] = value;
    setValue('services', services);
  };

  const handleEducationChange = (index: number, value: string) => {
    const education = getValues('education') || [];
    education[index] = value;
    setValue('education', education);
  };

  const handleSpecializationChange = (index: number, value: string) => {
    const specialization = getValues('specialization') || [];
    specialization[index] = value;
    setValue('specialization', specialization);
  };

  const handleExperienceDetailsChange = (index: number, value: string) => {
    const experienceDetails = getValues('experienceDetails') || [];
    experienceDetails[index] = value;
    setValue('experienceDetails', experienceDetails);
  };
  const handleAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 200) {
      setValue('about', value);
      setAboutCharCount(value.length);
    }
  };

  return (
    <div className="min-h-screen flex  justify-center py-12 px-4 sm:px-6 lg:px-8 relative items-center">
      <div className="max-w-xl w-full space-y-8 p-10 bg-white rounded-xl shadow-lg z-10">
        <div className="grid  gap-8 grid-cols-1">
          <div className="flex flex-col ">
            <div className="flex flex-col sm:flex-row items-center">
              <h2 className="font-semibold text-lg mr-auto">
                Doctor Registration Form
              </h2>
              <div className="w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0"></div>
            </div>
            <div className="mt-5">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex items-center py-6">
                  <div className="w-40 h-40 mr-4 flex-none rounded-xl overflow-hidden">
                    <img
                      className="w-40 h-40 mr-4 object-cover"
                      src={image}
                      alt="Avatar Upload"
                    />
                  </div>
                  <Label className="cursor-pointer ">
                    <span className="focus:outline-none text-white text-sm py-2 px-4 rounded-full bg-[#273c75] hover:bg-opacity-80 hover:shadow-lg">
                      Browse
                    </span>
                    <Input
                      type="file"
                      {...register("image", { required: "Image is required" })}
                      onChange={handleImage}
                      className="hidden"
                    />
                    {errors.image && (
                      <span className="text-red-500">
                        {errors.image.message}
                      </span>
                    )}
                  </Label>
                </div>
                <div className="md:flex flex-row md:space-x-4 w-full text-xs">
                  <div className="mb-3 space-y-2 w-full text-xs">
                    <Label className="font-semibold text-gray-600 py-2">
                      Name:
                    </Label>
                    <Input
                      {...register("name", { required: "Name is required" })}
                      placeholder="Name"
                    />
                    {errors.name && (
                      <span className="text-red-500">
                        {errors.name.message}
                      </span>
                    )}
                  </div>

                  <div className="mb-3 space-y-2 w-full text-xs">
                    <Label className="font-semibold text-gray-600 py-2">
                      Email{" "}
                    </Label>
                    <Input
                      {...register("email", { required: "Email is required" })}
                      placeholder="Email ID"
                    />
                    {errors.email && (
                      <span className="text-red-500">
                        {errors.email.message}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-3 space-y-2 w-full text-xs">
                  <Label className=" font-semibold text-gray-600 py-2">
                    Phone
                  </Label>
                  <Input
                    {...register("phone", { required: "Phone is required" })}
                    placeholder="Phone"
                  />
                  {errors.phone && (
                    <span className="text-red-500">{errors.phone.message}</span>
                  )}
                </div>
                <div className="mb-3 space-y-2 w-full text-xs">
                  <Label className="font-semibold text-gray-600 py-2">
                    City
                  </Label>
                  <Input
                    {...register("city", { required: "City is required" })}
                    placeholder="City"
                  />
                  {errors.city && (
                    <span className="text-red-500">{errors.city.message}</span>
                  )}
                </div>

                <div className="mb-3 space-y-2 w-full text-xs">
                  <Label className="font-semibold text-gray-600 py-2">
                    Clinic Address
                  </Label>
                  <Input
                    {...register("streetAddress", {
                      required: "Clinic Address is required",
                    })}
                    placeholder="Clinic Address"
                  />
                  {errors.streetAddress && (
                    <span className="text-red-500">
                      {errors.streetAddress.message}
                    </span>
                  )}
                </div>
                <div className="md:flex md:flex-row md:space-x-4 w-full text-xs">
                  <div className="w-full flex flex-col mb-3 gap-y-2">
                    <Label className="font-semibold text-gray-600 pt-2">
                      Services
                    </Label>
                    {[...Array(5)].map((_, index) => (
                      <Input
                        key={index}
                        onChange={(e) =>
                          handleServicesChange(index, e.target.value)
                        }
                        placeholder={`Service ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="w-full flex flex-col mb-3 gap-y-2">
                    <Label className="font-semibold text-gray-600 pt-2">
                      Specialization
                    </Label>
                    {[...Array(5)].map((_, index) => (
                      <Input
                        key={index}
                        onChange={(e) =>
                          handleSpecializationChange(index, e.target.value)
                        }
                        placeholder={`Specialization ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mb-3 space-y-2 w-full text-xs">
                  <Label className=" font-semibold text-gray-600 py-2">
                    Education
                  </Label>
                  {[...Array(5)].map((_, index) => (
                    <Input
                      key={index}
                      onChange={(e) =>
                        handleEducationChange(index, e.target.value)
                      }
                      placeholder={`Education ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="mb-3 space-y-2 w-full text-xs">
                  <Label className=" font-semibold text-gray-600 py-2">
                    Experience Details
                  </Label>
                  {[...Array(5)].map((_, index) => (
                    <Input
                      key={index}
                      onChange={(e) =>
                        handleExperienceDetailsChange(index, e.target.value)
                      }
                      placeholder={`Experience ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="mb-3 space-y-2 w-full text-xs">
                  <Label className=" font-semibold text-gray-600 py-2">
                    Experience in Years
                  </Label>
                  <Input
                    type="number"
                    {...register("experienceYears", {
                      required: "Experience in Years is required",
                    })}
                    placeholder="Experience in Years"
                    min="0"
                  />
                  {errors.experienceYears && (
                    <span className="text-red-500">
                      {errors.experienceYears.message}
                    </span>
                  )}
                </div>

                <div className="flex-auto w-full mb-1 text-xs space-y-2">
                  <Label className="font-semibold text-gray-600 py-2">
                    About
                  </Label>
                  <Textarea
                    {...register("about", { required: "About is required" })}
                    placeholder="About"
                    className="min-h-[100px] max-h-[300px] h-28"
                    onChange={handleAboutChange}
                    maxLength={200}
                  />
                  <div className="text-right text-gray-500">
                    {aboutCharCount}/200 characters
                  </div>
                  {errors.about && (
                    <span className="text-red-500">{errors.about.message}</span>
                  )}
                </div>
                <Button type="submit">Submit</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileForm;