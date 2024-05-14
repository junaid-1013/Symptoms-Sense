import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

type Props = {
    register: any;
    errors: any;
    passwordError?: string;
    userType?: string;
    showLabel?: boolean;
    labelClassName?: string;
    inputClassName?: string;
    isGridLayout?: boolean;
    labelName?: string;
};

const PasswordInput = ({
    register,
    errors,
    passwordError,
    userType = "",
    showLabel = true,
    labelClassName = "",
    inputClassName = "col-span-3",
    isGridLayout = false,
    labelName = "Password"
}: Props) => {
    const [showPassword, setShowPassword] = useState(false);

    // function to get the error message based on the context
    const getErrorMessage = () => {
        if (passwordError) return passwordError;

        if (userType) {
            return `${userType.charAt(0).toUpperCase() + userType.slice(1)} password is required`;
        }

        return "Password is required";
    };

    if (isGridLayout) {
        return (
            <>
                <Label className="text-right">
                    {labelName}
                </Label>
                <div className={`relative ${inputClassName}`}>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            placeholder="••••••••"
                            {...register("password", { required: true })}
                            className={`${errors.password ? "border-red-500" : "border-gray-300"
                                } focus:border-black pr-10 ${inputClassName}`}
                        />

                        <div
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword((prev) => !prev)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>
                </div>

                {(errors.password || passwordError) && (
                    <Label className="text-right col-span-4 text-red-500 text-sm ">
                        {getErrorMessage()}
                    </Label>
                )}
            </>
        );
    }

    // for regular layouts
    return (
        <div className="relative w-full">
            {showLabel && (
                <Label className={`${labelClassName}`}>
                    {labelName}
                </Label>
            )}

            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    {...register("password", { required: true })}
                    className={`${errors.password ? "border-red-500" : "border-gray-300"
                        } focus:border-black pr-10 ${inputClassName}`}
                />

                <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((prev) => !prev)}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
            </div>

            {(errors.password || passwordError) && (
                <Label className="text-red-500 text-sm mt-1 block">
                    {getErrorMessage()}
                </Label>
            )}
        </div>
    );
};

export default PasswordInput;