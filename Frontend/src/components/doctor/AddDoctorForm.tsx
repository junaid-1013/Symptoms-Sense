'use client';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PasswordInput from "@/components/uiUtils/PasswordField";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { useUser } from "@/contextApis/UserContext";
import { ClinicDoctorRegisterApi } from "@/endPoints/clinic.endPoints";
import { AddDoctorFormData } from "@/types";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

const AddDoctorForm = () => {
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const [authError, setAuthError] = useState("");
    const { tokens, setClinicDoctors } = useUser();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
    } = useForm<AddDoctorFormData>();

    const submitHandler = (data: AddDoctorFormData) => {
        setIsAdding(true);

        ClinicDoctorRegisterApi({
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone,
            token: tokens?.accessToken || ""
        })
            .then(response => {
                if (response) {
                    reset();
                    setIsAdding(false);
                    if (response.data?.data?.doctors?.length) {
                        setClinicDoctors(response.data.data.doctors)
                    }
                    toast({
                        title: "Success",
                        description: "Doctor Successfully Added."
                    })
                    setOpen(false);
                }
            })
            .catch(error => {
                const message =
                error?.response?.data?.detail || 
                error?.response?.data?.message;
                setIsAdding(false);
                toast({
                    title: "Error",
                    description: message || "An unknown error occurred. Please try again later.",
                    variant: "destructive"
                })
            })
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-x-2 max-w-max self-end" size="sm">
                    <Plus  className="h-4 w-4"/>
                    Add&nbsp;Doctor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Doctors</DialogTitle>
                    <DialogDescription>
                        Add details of the doctor you want to create. Click add when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(submitHandler)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="Name"
                                {...register("name", { required: true })}
                                className={`${errors.name ? "border-red-500" : "border-gray-300"} col-span-3`}
                            />
                            {errors.name && (
                                <Label className="text-right col-span-4 text-red-500 text-sm">Doctor Name is required</Label>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">
                                Email
                            </Label>
                            <Input
                                type="email"
                                placeholder="abc@xyz.com"
                                {...register("email", { required: true })}
                                className={`${errors.email ? "border-red-500" : "border-gray-300"} col-span-3`}
                            />
                            {errors.email && (
                                <Label className="text-right col-span-4 text-red-500 text-sm">Doctor email is required</Label>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="03xx-xxxxxxx"
                                {...register("phone", { required: true })}
                                className={`${errors.phone ? "border-red-500" : "border-gray-300"} col-span-3`}
                            />
                            {errors.phone && (
                                <Label className="text-right col-span-4 text-red-500 text-sm">Doctor phone is required</Label>
                            )}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <PasswordInput
                                register={register}
                                errors={errors}
                                passwordError={authError}
                                userType="doctor"
                                isGridLayout={true}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <SpinnerButton
                            name="Add"
                            state={isAdding}
                            type="submit"
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default AddDoctorForm