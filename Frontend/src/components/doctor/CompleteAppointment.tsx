"use client";

import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contextApis/UserContext";
import { CompleteAppointmentApi } from "@/endPoints/doctor.endPoints";
import { CompleteAppointmentProps , FormValues } from "@/types";
import { X } from "lucide-react";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";

const CompleteAppointment: React.FC<CompleteAppointmentProps> = ({ appointmentId, setAppointments }) => {
  const { toast } = useToast();
  const { clinicMedicines, tokens} = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      symptoms: "",
      diagnosis: "",
      diagnosis_details: "",
      prescription_notes: "",
      prescription_instructions: "",
      medicines: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medicines",
  });
  

  const onSubmit = (data: FormValues) => {
    if (!tokens?.accessToken) return;
    setIsSubmitting(true);

  CompleteAppointmentApi({
    appointment_id: appointmentId,
    symptoms: data.symptoms,
    diagnosis: data.diagnosis,
    diagnosis_details: data.diagnosis_details,
    prescription_notes: data.prescription_notes,
    prescription_instructions: data.prescription_instructions,
    medicines: data.medicines,
    token: tokens.accessToken,
  })
    .then((response) => {
      if (response.data.status === "success") {
        toast({
          title: "Success",
          description: "Appointment completed successfully",
        });
        setAppointments?.(response.data.data.appointments);
        reset();
        setIsSubmitting(false);
        setIsOpen(false);
      } else {
        setIsSubmitting(false);
        toast({
          title: "Error",
          description: response.data.message || "Failed to complete appointment",
          variant: "destructive",
        });
      }
    })
    .catch((error) => {
      setIsSubmitting(false);
      const message =
                error?.response?.data?.detail || 
                error?.response?.data?.message || "Something went wrong";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    });
};

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild >
        <Button variant="outline" className="w-full">
          Complete Appointment
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto space-y-4">
        <DialogHeader>
          <DialogTitle>Complete Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <label className="font-medium">Symptoms</label>
            <Textarea {...register("symptoms", { required: true })} />
            {errors.symptoms && <p className="text-red-500 text-sm">Symptoms are required</p>}
          </div>

          <div className="grid gap-2">
            <label className="font-medium">Diagnosis</label>
            <Input {...register("diagnosis", { required: true })} />
            {errors.diagnosis && <p className="text-red-500 text-sm">Diagnosis is required</p>}
          </div>

          <div className="grid gap-2">
            <label className="font-medium">Diagnosis Details</label>
            <Textarea {...register("diagnosis_details")} />
          </div>

          <div className="grid gap-2">
            <label className="font-medium">Prescription Notes</label>
            <Textarea {...register("prescription_notes")} />
          </div>

          <div className="grid gap-2">
            <label className="font-medium">Prescription Instructions</label>
            <Textarea {...register("prescription_instructions")} />
          </div>

          {/* Medicines */}
          <div className="space-y-2">
            <label className="font-medium">Medicines</label>

            {fields.map((field, index) => (
            <div
                key={field.id}
                className="border rounded-lg bg-gray-50 p-4 space-y-4 shadow-sm relative"
            >
                {/* Medicine Header with Remove Button */}
                <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700 text-base">
                    Medicine {index + 1}
                </span>
                <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-100"
                    onClick={() => remove(index)}
                    aria-label="Remove Medicine"
                >
                    <X className="h-5 w-5 text-red-600" />
                </Button>
                </div>

                {/* Medicine Name */}
                <div className="flex flex-col">
                <label className="text-gray-600 text-sm font-medium mb-1">Medicine Name</label>
                <Controller
                    name={`medicines.${index}.name`}
                    control={control}
                    render={({ field: selectField }) => (
                    <Select
                      disabled={!Array.isArray(clinicMedicines) || clinicMedicines.length === 0}
                      value={selectField.value}
                      onValueChange={(val) => {
                        selectField.onChange(val);

                        const selected = clinicMedicines?.find((m) => m.name === val);
                        if (selected) {
                          setValue(`medicines.${index}.description`, selected.description);
                          setValue(`medicines.${index}.manufacturer`, selected.manufacturer);
                          setValue(`medicines.${index}.category`, selected.category);
                        }
                      }}
                    >
                        <SelectTrigger>
                        <SelectValue
                          placeholder={
                            Array.isArray(clinicMedicines) && clinicMedicines.length > 0
                              ? "Select Medicine"
                              : "No Medicines Available"
                          }
                        />
                        </SelectTrigger>
                        <SelectContent>
                        { Array.isArray(clinicMedicines) && clinicMedicines.length > 0 ? (
                            clinicMedicines.map((m) => (
                            <SelectItem key={m.id} value={m.name}>
                                {m.name}
                            </SelectItem>
                            ))
                        ) : null}
                        </SelectContent>
                    </Select>
                    )}
                />
                </div>

                {/* Medicine Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col">
                    <label className="text-gray-600 text-sm font-medium mb-1">Description</label>
                    <Input
                    {...register(`medicines.${index}.description`)}
                    placeholder="Description"
                    readOnly
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-gray-600 text-sm font-medium mb-1">Manufacturer</label>
                    <Input
                    {...register(`medicines.${index}.manufacturer`)}
                    placeholder="Manufacturer"
                    readOnly
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-gray-600 text-sm font-medium mb-1">Category</label>
                    <Input
                    {...register(`medicines.${index}.category`)}
                    placeholder="Category"
                    readOnly
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-gray-600 text-sm font-medium mb-1">Dosage</label>
                    <Input
                    {...register(`medicines.${index}.dosage`, { required: true })}
                    placeholder="Dosage"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-gray-600 text-sm font-medium mb-1">Frequency</label>
                    <Input
                    {...register(`medicines.${index}.frequency`, { required: true })}
                    placeholder="Frequency"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-gray-600 text-sm font-medium mb-1">Duration (days)</label>
                    <Input
                    type="number"
                    {...register(`medicines.${index}.duration_days`, {
                        required: true,
                        valueAsNumber: true,
                    })}
                    placeholder="e.g., 5"
                    />
                </div>
                </div>
            </div>
            ))}

            <Button
              onClick={() => append({
                name: "",
                description: "",
                manufacturer: "",
                category: "",
                dosage: "",
                frequency: "",
                duration_days: 1,
              })}
              variant="outline"
              className="w-full"
            >
              + Add Medicine
            </Button>
          </div>

          <DialogFooter>
            <SpinnerButton type="submit"  state={isSubmitting} name="Submit" className="w-full"></SpinnerButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteAppointment;
