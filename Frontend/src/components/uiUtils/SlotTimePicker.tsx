"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SlotTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  slotDuration?: number;
  disabled?: boolean;
  minTime?: string; // For end time validation
  label?: string;
}

const SlotTimePicker: React.FC<SlotTimePickerProps> = ({
  value,
  onChange,
  slotDuration = 30,
  disabled = false,
  minTime,
  label,
}) => {
  // Generate time options based on slot duration
  const generateTimeOptions = (): string[] => {
    const times: string[] = [];
    const startHour = 0;
    const endHour = 24;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? "AM" : "PM";
        const timeStr = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
        times.push(timeStr);
      }
    }

    return times;
  };

  // Parse time to minutes for comparison
  const timeToMinutes = (time: string): number => {
    if (!time) return -1;
    
    const [timePart, period] = time.split(" ");
    const [hourStr, minuteStr] = timePart.split(":");
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
  };

  const allTimes = generateTimeOptions();
  
  // Filter times based on minTime if provided
  const availableTimes = minTime
    ? allTimes.filter((time) => {
        const currentMinutes = timeToMinutes(time);
        const minMinutes = timeToMinutes(minTime);
        // End time must be at least one slot duration after start time
        return currentMinutes >= minMinutes + slotDuration;
      })
    : allTimes;

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {availableTimes.length === 0 ? (
            <div className="p-2 text-sm text-gray-500 text-center">
              {minTime ? "No valid end times available" : "No times available"}
            </div>
          ) : (
            availableTimes.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SlotTimePicker;

