"use client";
import React,{useState} from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from "axios";
import Swal from 'sweetalert2';
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

const ProfileForm: React.FC = () => {
  const [image, setImage] = useState([]);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>();
  const handleImage = (e:any) =>{
    const file = e.target.files[0];
    setFileToBase(file);
    console.log(file);
}

const setFileToBase = (file:any) =>{
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () =>{
        setImage(reader.result as any);
    }

}
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const onLogin = async () => {
        try {
          data.img =image;
          
          if (
            data.services.length === 0 ||
            data.education.length === 0 ||
            data.specialization.length === 0 ||
            data.experienceDetails.length === 0
          ) {
            throw new Error('Please enter at least one item in each of the required fields.');
          }
            const response = await axios.post("/api/regDoctor", data);
            
            
            console.log(" Success", response.data);
          
            
            Swal.fire('Success!', 'Successful', 'success');

        } catch (error: any) {
            Swal.fire('Failed!', error, 'error');
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 border border-gray-300">
      <label className="block mb-2">
        Name:
        <input
          {...register('name', { required: 'Name is required' })}
          className="border border-gray-400 p-2 w-full"
        />
        {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      </label>

      <label className="block mb-2">
        Email:
        <input
          {...register('email', { required: 'Email is required', pattern: /^\S+@\S+$/i })}
          className="border border-gray-400 p-2 w-full"
        />
        {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      </label>

      <label className="block mb-2">
        Phone:
        <input
          {...register('phone', { required: 'Phone is required' })}
          className="border border-gray-400 p-2 w-full"
        />
        {errors.phone && <span className="text-red-500">{errors.phone.message}</span>}
      </label>

      <label className="block mb-2">
        Image:
        <input
          type="file"
          {...register('image', { required: 'Image is required' })}
          onChange={handleImage}
          className="border border-gray-400 p-2 w-full"
        />
        {errors.image && <span className="text-red-500">{errors.image.message}</span>}
      </label>

      <label className="block mb-2">
        Services:
        {[...Array(5)].map((_, index) => (
          <input
            key={index}
            onChange={(e) => handleServicesChange(index, e.target.value)}
            className="border border-gray-400 p-2 w-full mb-2"
          />
        ))}
      </label>

      <label className="block mb-2">
        Education:
        {[...Array(5)].map((_, index) => (
          <input
            key={index}
            onChange={(e) => handleEducationChange(index, e.target.value)}
            className="border border-gray-400 p-2 w-full mb-2"
          />
        ))}
      </label>

      <label className="block mb-2">
        Specialization:
        {[...Array(5)].map((_, index) => (
          <input
            key={index}
            onChange={(e) => handleSpecializationChange(index, e.target.value)}
            className="border border-gray-400 p-2 w-full mb-2"
          />
        ))}
      </label>

      <label className="block mb-2">
        Experience Details:
        {[...Array(5)].map((_, index) => (
          <input
            key={index}
            onChange={(e) => handleExperienceDetailsChange(index, e.target.value)}
            className="border border-gray-400 p-2 w-full mb-2"
          />
        ))}
      </label>

      <label className="block mb-2">
        Experience in Years:
        <input
          type="number"
          {...register('experienceYears', {
            required: 'Experience in Years is required',
          })}
          className="border border-gray-400 p-2 w-full"
        />
        {errors.experienceYears && (
          <span className="text-red-500">{errors.experienceYears.message}</span>
        )}
      </label>

      <label className="block mb-2">
        About:
        <textarea
          {...register('about', { required: 'About is required' })}
          className="border border-gray-400 p-2 w-full"
        />
        {errors.about && <span className="text-red-500">{errors.about.message}</span>}
      </label>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
};

export default ProfileForm;