"use client";
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from "axios";
import Swal from 'sweetalert2';
import { useRouter } from "next/navigation";
interface FormValues {
  img: any;
  name: string;
  email: string;
  phone: string;
  image: FileList;
  services: string[];
  education: string[];
  specialization: string[];
  experienceYears: number;
  experienceDetails: string[];
  about: string;
}

const DoctorProfileForm: React.FC = () => {
  const router = useRouter();

  const [image, setImage] = useState('/user.png');
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>();

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
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const onLogin = async () => {
      try {
        data.img = image;

        if (
          ((data.services ?? []).length === 0) || ((data.services ?? [])[0]=='')
        ) {          throw new Error('Please provide atlease one service, then proceed to complete services 1 through 5 in sequential order');

        }
        else if (
          
          ((data.education ?? []).length === 0) || ((data.education?? [])[0]=='')
         
        ) {          throw new Error('Please provide atlease one education, then proceed to complete education 1 through 5 in sequential order');

        }
       else if (
         
        ((data.specialization ?? []).length === 0) || ((data.specialization ?? [])[0]=='')
        ) {          throw new Error('Please provide atlease one specialization, then proceed to complete specialization 1 through 5 in sequential order');

        }
       else if (
        ((data.experienceDetails ?? []).length === 0) || ((data.experienceDetails ?? [])[0]=='')
        ) {          throw new Error('Please enter atlease one Experience Detail, then proceed to complete 1 through 5 in sequential order');

        }
        
        const response = await axios.post("/api/regDoctor", data);
        const { protocol, host } = window.location;
        const url =  `${protocol}//${host}`;
        const data1 = {
            email:data.email,
            url : url,
        }
        const res = await axios.post("/api/doctorPasswordSetup", data1);
        Swal.fire('Success!', 'Congratulations! You have successfully registered as a doctor. We have emailed you instructions to set up your password. To activate your account and gain access to your dashboard, please proceed to set up your password.', 'success');
        router.push("/");

      } catch (error:any) {
        if (error.response && error.response.data && error.response.data.error) {
            Swal.fire('Failed!', error.response.data.error, 'error');
        } else {
            Swal.fire('Failed!', error.message, 'error');
        }
    }  finally {

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

  return (
    <>

      <div className="min-h-screen flex  justify-center py-12 px-4 sm:px-6 lg:px-8 relative items-center">
        <div className="max-w-xl w-full space-y-8 p-10 bg-white rounded-xl shadow-lg z-10">
          <div className="grid  gap-8 grid-cols-1">
            <div className="flex flex-col ">
              <div className="flex flex-col sm:flex-row items-center">
                <h2 className="font-semibold text-lg mr-auto">Doctor Registration Form</h2>
                <div className="w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0"></div>
              </div>
              <div className="mt-5">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex items-center py-6">
                    <div className="w-40 h-40 mr-4 flex-none rounded-xl overflow-hidden">
                      <img
                        className="w-40 h-40 mr-4 object-cover"
                        src={image}
                        alt="Avatar Upload" />
                    </div>
                    <label className="cursor-pointer ">
                      <span className="focus:outline-none text-white text-sm py-2 px-4 rounded-full bg-[#273c75] hover:bg-opacity-80 hover:shadow-lg">Browse</span>
                      <input
                        type="file"
                        {...register('image', { required: 'Image is required' })}
                        onChange={handleImage}
                        className="hidden"
                      />
                      {errors.image && <span className="text-red-500">{errors.image.message}</span>}
                    </label>
                  </div>
                  <div className="md:flex flex-row md:space-x-4 w-full text-xs">
                    <div className="mb-3 space-y-2 w-full text-xs">
                      <label className="font-semibold text-gray-600 py-2">Name:</label>
                      <input
                        {...register('name', { required: 'Name is required' })}
                        placeholder='Name'
                        className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4"
                      />
                      {errors.name && <span className="text-red-500">{errors.name.message}</span>}
                    </div>
                    <div className="mb-3 space-y-2 w-full text-xs">
                      <label className="font-semibold text-gray-600 py-2">Email </label>
                      <input
                        {...register('email', { required: 'Email is required'})}
                        placeholder="Email ID"
                        className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4"
                      />
                      {errors.email && <span className="text-red-500">{errors.email.message}</span>}
                    </div>
                  </div>
                  <div className="mb-3 space-y-2 w-full text-xs">
                    <label className=" font-semibold text-gray-600 py-2">Phone</label>
                    <input
                      {...register('phone', { required: 'Phone is required' })}
                      placeholder='Phone'
                      className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4"
                    />
                    {errors.phone && <span className="text-red-500">{errors.phone.message}</span>}
                  </div>
                  <div className="md:flex md:flex-row md:space-x-4 w-full text-xs">
                    <div className="w-full flex flex-col mb-3">
                      <label className="font-semibold text-gray-600 py-2">Services</label>
                      {[...Array(5)].map((_, index) => (
                        <input
                          key={index}
                          onChange={(e) => handleServicesChange(index, e.target.value)}
                          placeholder={`Service ${index + 1}`}
                          className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4 my-1"
                        />
                      ))}
                    </div>
                    <div className="w-full flex flex-col mb-3">
                      <label className="font-semibold text-gray-600 py-2">Specialization</label>
                      {[...Array(5)].map((_, index) => (
                        <input
                          key={index}
                          onChange={(e) => handleSpecializationChange(index, e.target.value)}
                          placeholder={`Specialization ${index + 1}`}
                          className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4 my-1"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mb-3 space-y-2 w-full text-xs">
                    <label className=" font-semibold text-gray-600 py-2">Education</label>
                    {[...Array(5)].map((_, index) => (
                      <input
                        key={index}
                        onChange={(e) => handleEducationChange(index, e.target.value)}
                        placeholder={`Education ${index + 1}`}
                        className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4 my-1"
                      />
                    ))}
                  </div>

                  <div className="mb-3 space-y-2 w-full text-xs">
                    <label className=" font-semibold text-gray-600 py-2">Experience Details</label>
                    {[...Array(5)].map((_, index) => (
                      <input
                        key={index}
                        onChange={(e) => handleExperienceDetailsChange(index, e.target.value)}
                        placeholder={`Experience ${index + 1}`}
                        className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4 my-1"
                      />
                    ))}
                  </div>

                  <div className="mb-3 space-y-2 w-full text-xs">
                    <label className=" font-semibold text-gray-600 py-2">Experience in Years</label>
                    <input
                      type="number"
                      {...register('experienceYears', {
                        required: 'Experience in Years is required',
                      })}
                      placeholder='Experience in Years'
                      className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded-lg h-10 px-4"
                      min="0"
                    />
                    {errors.experienceYears && (
                      <span className="text-red-500">{errors.experienceYears.message}</span>
                    )}
                  </div>

                  <div className="flex-auto w-full mb-1 text-xs space-y-2">
                    <label className="font-semibold text-gray-600 py-2">About</label>
                    <textarea
                      {...register('about', { required: 'About is required' })}
                      placeholder='About'
                      className="min-h-[100px] max-h-[300px] h-28 appearance-none block w-full bg-grey-lighter text-grey-darker border 
                      border-grey-lighter rounded-lg  py-4 px-4"
                    />
                    {errors.about && <span className="text-red-500">{errors.about.message}</span>}
                  </div>

                  <button
                    type="submit"
                    className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80"
                  >
                    Submit
                  </button>

                </form>
              </div>
            </div>
          </div>
        </div>
      </div >

      
    </>
  );
};

export default DoctorProfileForm;