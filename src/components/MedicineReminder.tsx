"use client";
import Swal from 'sweetalert2';
import { useRouter } from "next/navigation";
import { useState } from 'react';
import axios from "axios";
const MedicineForm = () => {
  const router = useRouter();

  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState(1);
  const [selectedDays, setSelectedDays]:any = useState([]);
  const [everyDay, setEveryDay] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [medicineType, setMedicineType] = useState('');

  const daysOfWeek = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];

  const handleDayToggle = (day :any) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d:any) => d !== day));
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

  const handleSubmit = async(e :any) => {
    e.preventDefault();
const data={

    medicineName,
    dosage,
    selectedDays,
    reminderTime,
    medicineType,

}
    const response = await axios.post("/api/medicineReminder", data);
    router.push("/profile");
      Swal.fire('Success!', 'Reminder has been added successfully', 'success');
  };

  return (
    <form className="max-w-md mx-auto mt-8" onSubmit={handleSubmit}>
      <label className="block text-gray-700 text-sm font-bold mb-2">Medicine Name</label>
      <input
        type="text"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="Enter medicine name"
        value={medicineName}
        onChange={(e) => setMedicineName(e.target.value)}
      />

      <label className="block text-gray-700 text-sm font-bold mt-4 mb-2">Dosage</label>
      <input
        type="number"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        placeholder="Enter dosage"
        value={dosage}
        onChange={(e:any) => setDosage(e.target.value)}
      />

<div className="mt-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Medicine Days</label>
        <div className="flex">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              type="button"
              className={`rounded-full px-3 py-1 mr-2 ${
                selectedDays.includes(day)
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-700 hover:bg-blue-500 hover:text-white'
              } focus:outline-none`}
              onClick={() => handleDayToggle(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="mt-2">
          <input
            type="checkbox"
            className="mr-2 leading-tight"
            checked={everyDay}
            onChange={handleEveryDayToggle}
          />
          <label className="text-gray-700 text-sm">Every Day</label>
        </div>
      </div>

      <label className="block text-gray-700 text-sm font-bold mt-4 mb-2">Reminder Time</label>
      <input
        type="time"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        value={reminderTime}
        onChange={(e) => setReminderTime(e.target.value)}
      />

      <label className="block text-gray-700 text-sm font-bold mt-4 mb-2">Medicine Type</label>
      <select
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
        className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Submit
      </button>
    </form>
  );
};

export default MedicineForm;
