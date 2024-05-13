"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from 'react';
const MedicineForm = () => {
  const router = useRouter();
  const { toast } = useToast()

  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState(1);
  const [selectedDays, setSelectedDays]: any = useState([]);
  const [everyDay, setEveryDay] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [medicineType, setMedicineType] = useState('');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  const handleSubmit = async (e: any) => {
    try {
      e.preventDefault();
      const data = {

        medicineName,
        dosage,
        selectedDays,
        reminderTime,
        medicineType,

      }
      const response = await axios.post("/api/medicineReminder", data);
      router.push("/profile");
      toast({
        title: "Success!",
        description: "Reminder has been added successfully",
      })
    }
    catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        toast({
          title: "Failed!",
          description: error.response.data.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed!",
          description: "An error occurred during signup.",
          variant: "destructive",
        })
      }
    } finally {

    }
  };

  return (
    <form className="max-w-md mx-auto my-8 flex flex-col gap-y-4" onSubmit={handleSubmit}>
      <label className="block text-lg font-bold">Medicine Name</label>
      <input
        type="text"
        className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="Enter medicine name"
        value={medicineName}
        required
        onChange={(e) => setMedicineName(e.target.value)}
      />

      <label className="block text-lg font-bold">Dosage</label>
      <input
        type="number"
        className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="Enter dosage"
        value={dosage}
        min="1"
        required
        onChange={(e: any) => setDosage(e.target.value)}
      />


      <label className="block text-lg font-bold">Medicine Days</label>
      <div className="flex justify-between">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            type="button"
            className={`rounded-full px-3 py-1 ${selectedDays.includes(day)
              ? 'bg-[#273c75] text-white'
              : 'bg-gray-200 hover:bg-[#273c75] hover:text-white'
              } focus:outline-none`}
            onClick={() => handleDayToggle(day)}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-x-2">
        <Checkbox
          checked={everyDay}
          onCheckedChange={handleEveryDayToggle}
        />
        <label>Every Day</label>
      </div>


      <label className="block text-lg font-bold">Reminder Time</label>
      <input
        type="time"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        value={reminderTime}
        onChange={(e) => setReminderTime(e.target.value)}
      />

      <label className="block font-bold text-lg">Medicine Type</label>
      <select
        className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
        value={medicineType}
        onChange={(e) => setMedicineType(e.target.value)}
      >
        <option value="">Select type</option>
        <option value="tablet">Tablet</option>
        <option value="capsule">Capsule</option>
        <option value="liquid">Liquid</option>
        <option value="drops">Drops</option>
        <option value="inhaler">Inhaler</option>
        <option value="injection">Injection</option>
        <option value="emulsion">Emulsion</option>
      </select>

      <button
        type="submit"
        className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80"
      >
        Submit
      </button>
    </form>
  );
};

export default MedicineForm;
