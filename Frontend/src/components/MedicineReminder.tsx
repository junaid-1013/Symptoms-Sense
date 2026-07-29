"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton";
import { MEDICINE_TYPES } from "@/config/constants";
import { AddReminderApi, GetReminderConfigApi } from "@/endPoints/reminders.endPoints";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
type FormData = {
  medicineName: string;
  dosage: number;
  reminderTime: string;
  medicineType: string;
  days: string[];
};

export default function MedicineForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [timezone, setTimezone] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  const [retry, setRetry] = useState(0);
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    mode: "onChange",
    defaultValues: { medicineName: "", medicineType: "", days: [], reminderTime: "10:30" },
  });

  useEffect(() => {
    let cancelled = false;
    setConfigError(false);
    GetReminderConfigApi()
      .then((response) => {
        if (!response.data.data.timezone) throw new Error("Missing timezone");
        if (!cancelled) setTimezone(response.data.data.timezone);
      })
      .catch(() => { if (!cancelled) setConfigError(true); });
    return () => { cancelled = true; };
  }, [retry]);

  const onSubmit = async (form: FormData) => {
    if (!timezone) return;
    try {
      await AddReminderApi({
        medicine_name: form.medicineName.trim(),
        dosage: form.dosage,
        medicine_type: form.medicineType,
        days_of_week: form.days,
        reminder_time: form.reminderTime,
      });
      router.push("/profile");
      toast({ title: "Success!", description: "Reminder has been added successfully" });
    } catch (error: any) {
      toast({
        title: "Failed!",
        description: error?.response?.data?.message || "An error occurred while adding the reminder",
        variant: "destructive",
      });
    }
  };

  return (
    <form className="max-w-md mx-auto my-8 flex flex-col gap-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Label htmlFor="medicine-name">Medicine Name</Label>
      <Input id="medicine-name" placeholder="Enter medicine name" disabled={isSubmitting} maxLength={100}
        {...register("medicineName", {
          required: "Medicine name is required",
          validate: (value) => value.trim().length > 0 || "Medicine name cannot be blank",
          maxLength: { value: 100, message: "Use at most 100 characters" },
        })} />
      {errors.medicineName && <p role="alert" className="text-destructive text-sm">{errors.medicineName.message}</p>}

      <Label htmlFor="medicine-dosage">Dosage</Label>
      <Input id="medicine-dosage" type="number" min={1} step={1} placeholder="Enter dosage" disabled={isSubmitting}
        {...register("dosage", {
          valueAsNumber: true,
          required: "Dosage is required",
          validate: (value) => (Number.isInteger(value) && value > 0) || "Enter a positive whole number",
        })} />
      {errors.dosage && <p role="alert" className="text-destructive text-sm">{errors.dosage.message}</p>}

      <Controller name="days" control={control} rules={{ validate: (value) => value.length > 0 || "Select at least one day" }}
        render={({ field }) => (
          <fieldset disabled={isSubmitting} className="space-y-3">
            <legend className="text-sm font-medium mb-2">Medicine Days</legend>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <Button key={day} type="button" variant={field.value.includes(day) ? "default" : "outline"}
                  aria-pressed={field.value.includes(day)}
                  onClick={() => field.onChange(field.value.includes(day) ? field.value.filter((value) => value !== day) : [...field.value, day])}>
                  {day}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="every-day" checked={field.value.length === daysOfWeek.length}
                disabled={isSubmitting} onCheckedChange={(checked) => field.onChange(checked === true ? [...daysOfWeek] : [])} />
              <Label htmlFor="every-day">Every Day</Label>
            </div>
          </fieldset>
        )} />
      {errors.days && <p role="alert" className="text-destructive text-sm">{errors.days.message}</p>}

      <Label htmlFor="reminder-time">Reminder Time</Label>
      <Input id="reminder-time" type="time" step={60} disabled={isSubmitting} aria-describedby="reminder-timezone"
        {...register("reminderTime", {
          required: "Reminder time is required",
          pattern: { value: /^([01][0-9]|2[0-3]):[0-5][0-9]$/, message: "Choose a time with hours and minutes" },
        })} />
      {errors.reminderTime && <p role="alert" className="text-destructive text-sm">{errors.reminderTime.message}</p>}
      <p id="reminder-timezone" className="text-sm text-muted-foreground" role="status">
        {timezone ? `Repeats on your selected weekdays in ${timezone}.` : configError ? "Unable to load the scheduling timezone. Please retry before submitting." : "Loading scheduling timezone…"}
      </p>
      {configError && <Button type="button" variant="outline" onClick={() => setRetry((value) => value + 1)}>Retry</Button>}

      <Label htmlFor="medicine-type">Medicine Type</Label>
      <Controller name="medicineType" control={control} rules={{ required: "Select a medicine type" }}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
            <SelectTrigger id="medicine-type" ref={field.ref} onBlur={field.onBlur}><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {MEDICINE_TYPES.map((type) => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
      {errors.medicineType && <p role="alert" className="text-destructive text-sm">{errors.medicineType.message}</p>}

      <SpinnerButton state={isSubmitting} disabled={isSubmitting || !timezone} aria-busy={isSubmitting}
        aria-label={isSubmitting ? "Adding reminder" : "Add reminder"} name="Submit" type="submit" />
    </form>
  );
}
