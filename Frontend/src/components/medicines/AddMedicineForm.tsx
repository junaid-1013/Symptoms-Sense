"use client"
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
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { AddMedicineApi } from "@/endPoints/clinic.endPoints";
import { useUser } from "@/contextApis/UserContext";
import { MEDICINE_TYPES } from "@/config/constants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AddMedicineFormData {
    name: string;
    description: string;
    manufacturer: string;
    category: string;
}

const AddMedicineForm = () => {
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [open, setOpen] = useState(false);
    const { setClinicMedicines } = useUser();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset
    } = useForm<AddMedicineFormData>();

    const submitHandler = (data: AddMedicineFormData) => {
        setIsAdding(true);

        AddMedicineApi({
            name: data.name,
            description: data.description,
            manufacturer: data.manufacturer,
            category: data.category
        })
        .then(response => {
            setIsAdding(false);

            if (response?.data?.data?.length) {
                setClinicMedicines?.(response.data.data);
            }

            toast({
                title: "Success",
                description: "Medicine Successfully Added."
            });

            reset();
            setOpen(false);
        })
        .catch(error => {
            const message =
                error?.response?.data?.detail || 
                error?.response?.data?.message;
            setIsAdding(false);
            toast({
                title: "Error",
                description: message || "An unknown error occurred.",
                variant: "destructive"
            });
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-x-2 max-w-max self-end" size="sm">
                    <Plus className="h-4 w-4" />
                    Add Medicine
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Medicine</DialogTitle>
                    <DialogDescription>
                        Add details for the medicine. Click Add when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(submitHandler)}>
                    <div className="grid gap-4 py-4">

                        {/* Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input
                                placeholder="Medicine Name"
                                {...register("name", { required: true })}
                                className={`col-span-3 ${errors.name ? "border-red-500" : ""}`}
                            />
                            {errors.name && (
                                <Label className="text-right col-span-4 text-red-500 text-sm">
                                    Name is required
                                </Label>
                            )}
                        </div>

                        {/* Description */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Description</Label>
                            <Input
                                placeholder="Description"
                                {...register("description", { required: true })}
                                className={`col-span-3 ${errors.description ? "border-red-500" : ""}`}
                            />
                            {errors.description && (
                                <Label className="text-right col-span-4 text-red-500 text-sm">
                                    Description is required
                                </Label>
                            )}
                        </div>

                        {/* Manufacturer */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Manufacturer</Label>
                            <Input
                                placeholder="Company Name"
                                {...register("manufacturer", { required: true })}
                                className={`col-span-3 ${errors.manufacturer ? "border-red-500" : ""}`}
                            />
                            {errors.manufacturer && (
                                <Label className="text-right col-span-4 text-red-500 text-sm">
                                    Manufacturer is required
                                </Label>
                            )}
                        </div>

                        {/* Category */}
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Category</Label>
                        <Controller
                            name="category"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="col-span-3 w-full">
                                <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent className="max-h-56 overflow-y-auto">
                                {MEDICINE_TYPES.map(cat => (
                                    <SelectItem key={cat} value={cat}>
                                    {cat}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            )}
                        />
                        {errors.category && (
                            <Label className="text-right col-span-4 text-red-500 text-sm">
                            Category is required
                            </Label>
                        )}
                        </div>

                    </div>

                    <DialogFooter>
                        <SpinnerButton name="Add" state={isAdding} type="submit" />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddMedicineForm;
