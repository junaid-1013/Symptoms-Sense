"use client";
import { useRouter } from "next/navigation";
import ResetPasswordForm from '@/components/ResetPasswordForm';
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Swal from 'sweetalert2';

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  let token = searchParams.get("token");

  const handleResetPassword = async (newPassword: string) => {
    try {
      const data={
token,newPassword

      }
      const response = await axios.put("/api/forgot_password", data);
      router.push("/login");
    
      Swal.fire('Success!', 'Password changed. please login with new password.', 'success');
      
    } catch (error:any) {
      if (error.response && error.response.data && error.response.data.error) {
        Swal.fire('Failed!', error.response.data.error, 'error');
    } else {
        Swal.fire('Failed!', 'An error occurred ', 'error');
    }
    }
  };

  return (
    <div>
     
      <ResetPasswordForm onSubmit={handleResetPassword} />
    </div>
  );
};

export default ResetPasswordPage;