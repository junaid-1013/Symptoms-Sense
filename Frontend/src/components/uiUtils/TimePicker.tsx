"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Clock } from "lucide-react";

interface TimeSpinnerProps {
  value: string;
  onChange: (time: string) => void;
}

export default function TimePicker({ value, onChange }: TimeSpinnerProps) {
  const [open, setOpen] = useState(false);

  const parseTime = (t: string) => {
    if (!t) return { h: 9, m: 0 };
    const [h, m] = t.split(":").map(Number);
    return { h, m };
  };

  const { h, m } = parseTime(value);

  const incHour = () =>
    onChange(`${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);

  const decHour = () =>
    onChange(`${String((h - 1 + 24) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);

  const incMinute = () =>
    onChange(
      `${String(h).padStart(2, "0")}:${String((m + 1) % 60).padStart(2, "0")}`
    );

  const decMinute = () =>
    onChange(
      `${String(h).padStart(2, "0")}:${String((m - 1 + 60) % 60).padStart(2, "0")}`
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-indigo-300 text-indigo-700 hover:bg-indigo-50"
        >
          {value ? value : "Select Time"}
          <Clock className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-48 p-4">
        <div className="flex justify-center gap-6">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <ChevronUp className="cursor-pointer" onClick={incHour} />
            <div className="text-xl font-medium">{String(h).padStart(2, "0")}</div>
            <ChevronDown className="cursor-pointer" onClick={decHour} />
          </div>

          <div className="text-xl font-bold">:</div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <ChevronUp className="cursor-pointer" onClick={incMinute} />
            <div className="text-xl font-medium">{String(m).padStart(2, "0")}</div>
            <ChevronDown className="cursor-pointer" onClick={decMinute} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
