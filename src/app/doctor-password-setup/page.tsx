"use client";
import ResetPasswordForm from '@/components/ResetPasswordForm';
import { useToast } from '@/components/ui/use-toast';
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from 'react';

const ResetPasswordPage = () => {
  const router = useRouter();
  const { toast } = useToast()
  const searchParams = useSearchParams();
  let token = searchParams?.get("token");

  const handleResetPassword = async (newPassword: string) => {
    try {
      if (!token) {
        toast({
          title: "Error",
          description: "Invalid or missing token.",
          variant: "destructive"
        })
        return;
      }
      const data = { token, newPassword };
      const response = await axios.put("/api/doctorPasswordSetup", data);
      router.push("/login");
      toast({
        title: "Success!",
        description: "Your password has been successfully set up. Please log in to access your dashboard.",
      })
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        toast({
          title: "Error",
          description: error.response.data.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Error",
          description: "An error occurred",
          variant: "destructive"
        })
      }
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm onSubmit={handleResetPassword} title="Password Setup" />
    </Suspense>
  );
};

export default ResetPasswordPage;
