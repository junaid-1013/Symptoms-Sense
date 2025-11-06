"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import TimePicker from "@/components/uiUtils/TimePicker";
import { DoctorScheduleDialogProps } from "@/types";
import { toMinutes, formatTime } from "@/components/utils/Functions";

const DoctorScheduleDialog: React.FC<DoctorScheduleDialogProps> = ({
  open,
  onClose,
  day,
  slotDuration,
  onSave,
  existingData,
}) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [isOffDay, setIsOffDay] = useState(false);

  useEffect(() => {
    if (existingData && open) {
      setStartTime(existingData.start_time || "");
      setEndTime(existingData.end_time || "");
      setSlots(existingData.slots || []);
      setIsOffDay(Boolean(existingData.offDay));
    }
  }, [existingData, open]);

  useEffect(() => {
    if (isOffDay) {
      setSlots([]);
      return;
    }

    const duration = Number(slotDuration);
    if (!startTime || !endTime || !duration) {
      setSlots([]);
      return;
    }

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (end <= start) {
      setSlots([]);
      return;
    }

    const generated: string[] = [];
    let current = start;

    while (current + duration <= end) {
      const next = current + duration;
      generated.push(`${formatTime(current)} - ${formatTime(next)}`);
      current = next;
    }

    setSlots(generated);
  }, [startTime, endTime, slotDuration, isOffDay]);

  const handleSave = () => {
    const data = {
      day,
      start_time: startTime,
      end_time:  endTime,
      slot_duration: slotDuration,
      slots: isOffDay ? [] : slots,
      offDay: isOffDay,
    };

    onSave(data);
    onClose();
  };

  const handleToggleOffDay = (checked: boolean) => {
    setIsOffDay(checked);
    if (checked) {
      setStartTime("");
      setEndTime("");
      setSlots([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-semibold text-indigo-900">
              Edit Schedule for {day}
            </DialogTitle>
            <DialogDescription>
              Select timing or mark this day as off.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Label>Off Day</Label>
            <Switch checked={isOffDay} onCheckedChange={handleToggleOffDay} />
          </div>
        </DialogHeader>

        {!isOffDay && (
          <div className="space-y-5 py-2">
            <div className="flex flex-col gap-2">
              <Label>Start Time</Label>
              <TimePicker value={startTime} onChange={setStartTime}/>
            </div>

            <div className="flex flex-col gap-2">
              <Label>End Time</Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>

            {slots.length > 0 && (
              <div className="mt-3 border border-indigo-200 rounded-md p-3 bg-indigo-50 max-h-64 overflow-y-auto">
                <Label className="text-sm font-medium text-indigo-900">Generated Slots</Label>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {slots.map((slot, index) => (
                    <li
                      key={index}
                      className="px-3 py-2 rounded-md border border-indigo-200 bg-white shadow-sm"
                    >
                      {slot}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {isOffDay && (
          <p className="text-center text-sm text-gray-600 py-6">
            This day is marked as Off. No slots will be available.
          </p>
        )}

        <DialogFooter>
          <Button
            onClick={handleSave}
            className="bg-indigo-700 hover:bg-indigo-800 text-white"
          >
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorScheduleDialog;
