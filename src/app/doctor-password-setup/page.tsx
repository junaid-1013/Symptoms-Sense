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
      const response = await axios.put("/api/doctorPasswordSetup", data);
      router.push("/login");
    
      Swal.fire('Success!', 'Your password has been successfully set up. Please log in to access your dashboard.', 'success');
      
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
     
      <ResetPasswordForm onSubmit={handleResetPassword} title= " Password Setup" />
    </div>
  );
};

export default ResetPasswordPage;