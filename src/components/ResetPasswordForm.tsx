import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useState } from 'react';

interface ResetPasswordFormProps {
  onSubmit: (newPassword: string) => void;
  title: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSubmit, title }) => {
  const [password, setPassword] = useState('');
  const { toast } = useToast()
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Failed!",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return;
    }

    // Call the onSubmit callback with the new password
    onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="py-6">
        <div className="flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-w-sm lg:max-w-4xl">
          <div className="w-full p-8 lg:w-1/2">
            <div className="flex justify-center mb-2 ">
              <Image
                src="/logo-green.png"
                alt="green logo"
                height={1000}
                width={1000}
                className="w-36"
              />
            </div>
            <p className="text-lg text-gray-500 text-center font-semibold">{title}</p>
            <div className="mt-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
              <input

                value={password}
                onChange={handlePasswordChange}
                className="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                type="password"
              />
            </div>
            <div className="mt-4">
              <div className="flex justify-between">
                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
              </div>
              <input
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                type="password"
              />
            </div>
            <div className="mt-8">
              <button
                type="submit"
                className="bg-[#192a56] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#192a56]/75">
                Save Password
              </button>
            </div>


          </div>
          <div className="hidden lg:block lg:w-1/2 object-contain pb-8">
            <Image
              src='/loginImage.jpg'
              alt="login page "
              width={1000}
              height={1000}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default ResetPasswordForm;