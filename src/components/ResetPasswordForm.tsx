import PasswordInput from "@/components/uiUtils/PasswordField";
import Image from "next/image";
import { useForm } from 'react-hook-form';
import { SpinnerButton } from "./uiUtils/SpinnerButton";

interface ResetPasswordFormProps {
  onSubmit: (newPassword: string) => void;
  title: string;
}

interface FormData {
  password: string;
  confirmPassword: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSubmit, title }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    mode: 'onChange'
  });

  const password = watch('password');

  const onFormSubmit = (data: FormData) => {
    onSubmit(data.password);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="py-6">
        <div className="flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-w-sm lg:max-w-4xl">
          <div className="w-full p-8 lg:w-1/2">
            <div className="flex justify-center mb-2">
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
              <PasswordInput
                register={register}
                errors={errors}
                showLabel={true}
                labelName="New Password"
                labelClassName="block text-gray-700 text-sm font-bold mb-2"
                inputClassName="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                isGridLayout={false}
              />
            </div>

            <div className="mt-4">
              <PasswordInput
                register={(name: string, options: any) =>
                  register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match',
                    ...options
                  })
                }
                errors={{
                  password: errors.confirmPassword
                }}
                showLabel={true}
                labelName="Confirm Password"
                labelClassName="block text-gray-700 text-sm font-bold mb-2"
                inputClassName="bg-gray-100 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                isGridLayout={false}
                passwordError={errors.confirmPassword?.message}
              />
            </div>

            <div className="mt-8">
              <SpinnerButton
                state={isSubmitting}
                name="Save Password"
                className="bg-[#192a56] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#192a56]/75 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              />
            </div>
          </div>

          <div className="hidden lg:block lg:w-1/2 object-contain pb-8">
            <Image
              src='/loginImage.jpg'
              alt="login page"
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