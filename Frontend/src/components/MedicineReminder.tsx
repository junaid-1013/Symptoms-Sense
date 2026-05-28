"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/uiUtils/DatePicker";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { MEDICINE_TYPES } from "@/config/constants";
import { AddReminderApi } from "@/endPoints/reminders.endPoints";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import { useForm } from 'react-hook-form';

const MedicineForm = () => {
  const router = useRouter();
  const { toast } = useToast()
  const [selectedDays, setSelectedDays]: any = useState([]);
  const [everyDay, setEveryDay] = useState(false);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  type FormData = { medicineName: string; dosage: number; reminderTime: string; medicineType: string };
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ mode: 'onChange' });

  const handleDayToggle = (day: any) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d: any) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleEveryDayToggle = () => {
    if (everyDay) {
      setSelectedDays([]);
    } else {
      setSelectedDays([...daysOfWeek]);
    }
    setEveryDay(!everyDay);
  };

  const onSubmit = async (form: FormData) => {
    try {
      await AddReminderApi({
        medicine_name: form.medicineName,
        dosage: Number(form.dosage),
        medicine_type: form.medicineType,
        days_of_week: selectedDays,
        reminder_time: form.reminderTime,
      });
      router.push("/profile");
      toast({
        title: "Success!",
        description: "Reminder has been added successfully",
      })
    }
    catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "An error occurred while adding the reminder";
      toast({
        title: "Failed!",
        description: detail,
        variant: "destructive",
      })
    }
  };

  return (
    <form
      className="max-w-md mx-auto my-8 flex flex-col gap-y-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Label className="block text-base font-bold">Medicine Name</Label>
      <Input
        type="text"
        placeholder="Enter medicine name"
        {...register("medicineName", { required: "Medicine name is required" })}
      />
      {errors.medicineName && (
        <Label className="text-red-500 text-xs">
          {errors.medicineName.message}
        </Label>
      )}

      <Label className="block text-base font-bold">Dosage</Label>
      <Input
        type="number"
        placeholder="Enter dosage"
        min={1}
        {...register("dosage", {
          required: "Dosage is required",
          min: { value: 1, message: "Must be at least 1" },
        })}
      />
      {errors.dosage && (
        <Label className="text-red-500 text-xs">
          {errors.dosage.message as any}
        </Label>
      )}

      <Label className="block text-base font-bold">Medicine Days</Label>
      <div className="flex justify-between">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            type="button"
            className={`rounded-full px-3 py-1 ${selectedDays.includes(day)
              ? "bg-[#273c75] text-white"
              : "bg-gray-200 hover:bg-[#273c75] hover:text-white"
              } focus:outline-none`}
            onClick={() => handleDayToggle(day)}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-x-2">
        <Checkbox checked={everyDay} onCheckedChange={handleEveryDayToggle} />
        <Label>Every Day</Label>
      </div>

      <Label htmlFor="time-picker" className="text-base font-bold">
        Reminder Time
      </Label>
      <div className="grid grid-cols-2 gap-4">
        <DatePicker
          onChange={(value: string) =>
            setValue("reminderTime", value, { shouldValidate: true })
          }
        />
        <Input
          type="time"
          id="time-picker"
          defaultValue="10:30:00"
          step="1"
          className="col-span-1 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          {...register("reminderTime", {
            required: "Reminder time is required",
          })}
        />
      </div>
      {errors.reminderTime && (
        <Label className="text-red-500 text-xs">
          {errors.reminderTime.message}
        </Label>
      )}

      <Label className="block font-bold text-base">Medicine Type</Label>
      <Select
        onValueChange={(value: string) =>
          setValue("medicineType", value, { shouldValidate: true })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {MEDICINE_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.medicineType && (
        <Label className="text-red-500 text-xs">
          {errors.medicineType.message}
        </Label>
      )}

      <SpinnerButton
        state={isSubmitting}
        name="Submit"
        type="submit"
        className="bg-[#273c75] text-white font-medium rounded-lg hover:bg-opacity-80"
      />
    </form>
  );
};

export default MedicineForm;