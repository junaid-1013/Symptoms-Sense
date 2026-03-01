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
import { Input } from "@/components/ui/input";
import SlotTimePicker from "@/components/uiUtils/SlotTimePicker";
import { DoctorScheduleDialogProps } from "@/types";
import { toMinutes, formatTime } from "@/components/utils/Functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockDoctorSlotApi, UnblockDoctorSlotApi } from "@/endPoints/doctor.endPoints";
import { useUser } from "@/contextApis/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

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
  
  // Blocking state
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [blockDate, setBlockDate] = useState<Date | undefined>(undefined);
  const [isBlocking, setIsBlocking] = useState(false);

  const { tokens, setDoctorSchedule } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (existingData && open) {
      // Pre-fill with existing data
      const start = existingData.start_time || existingData.startHour || "";
      const end = existingData.end_time || existingData.endHour || "";
      
      setStartTime(start);
      setEndTime(end);
      setSlots(existingData.slots || []);
      setIsOffDay(Boolean(existingData.offDay));
    } else if (open) {
      // Reset to defaults
      setStartTime("");
      setEndTime("");
      setSlots([]);
      setIsOffDay(false);
    }
  }, [existingData, open]);

  // Reset end time when start time changes if it becomes invalid
  useEffect(() => {
    if (startTime && endTime) {
      const timeToMinutes = (time: string): number => {
        const [timePart, period] = time.split(" ");
        const [hourStr, minuteStr] = timePart.split(":");
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return hour * 60 + minute;
      };

      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const duration = Number(slotDuration);

      // If end time is now invalid, clear it
      if (endMinutes < startMinutes + duration) {
        setEndTime("");
      }
    }
  }, [startTime, slotDuration, endTime]);

  // Reset block end time when block start time changes if it becomes invalid
  useEffect(() => {
    if (blockStartTime && blockEndTime) {
      const timeToMinutes = (time: string): number => {
        const [timePart, period] = time.split(" ");
        const [hourStr, minuteStr] = timePart.split(":");
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return hour * 60 + minute;
      };

      const blockStartMinutes = timeToMinutes(blockStartTime);
      const blockEndMinutes = timeToMinutes(blockEndTime);
      const duration = Number(slotDuration);

      // If block end time is now invalid, clear it
      if (blockEndMinutes < blockStartMinutes + duration) {
        setBlockEndTime("");
      }
    }
  }, [blockStartTime, slotDuration, blockEndTime]);

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
    if (!isOffDay) {
      // Validate times
      if (!startTime || !endTime) {
        toast({
          title: "Validation Error",
          description: "Please select both start and end times",
          variant: "destructive",
        });
        return;
      }

      // Check if end time is at least one slot duration after start time
      const timeToMinutes = (time: string): number => {
        const [timePart, period] = time.split(" ");
        const [hourStr, minuteStr] = timePart.split(":");
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return hour * 60 + minute;
      };

      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const duration = Number(slotDuration);

      if (endMinutes <= startMinutes + duration - 1) {
        toast({
          title: "Validation Error",
          description: `End time must be at least ${duration} minutes after start time`,
          variant: "destructive",
        });
        return;
      }
    }

    const data = {
      day,
      start_time: startTime,
      end_time: endTime,
      slot_duration: slotDuration,
      slots: isOffDay ? [] : slots,
      offDay: isOffDay,
    };

    onSave(data);
  };

  const handleToggleOffDay = (checked: boolean) => {
    setIsOffDay(checked);
    if (checked) {
      setStartTime("");
      setEndTime("");
      setSlots([]);
    }
  };

  const handleBlockSlot = async () => {
    if (!blockStartTime || !blockEndTime) {
      toast({
        title: "Validation Error",
        description: "Please select both start and end time for the block",
        variant: "destructive",
      });
      return;
    }

    // Validate block times
    const timeToMinutes = (time: string): number => {
      const [timePart, period] = time.split(" ");
      const [hourStr, minuteStr] = timePart.split(":");
      let hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      return hour * 60 + minute;
    };

    const blockStartMinutes = timeToMinutes(blockStartTime);
    const blockEndMinutes = timeToMinutes(blockEndTime);
    const duration = Number(slotDuration);

    if (blockEndMinutes <= blockStartMinutes + duration - 1) {
      toast({
        title: "Validation Error",
        description: `Block end time must be at least ${duration} minutes after start time`,
        variant: "destructive",
      });
      return;
    }

    if (!isRecurring && !blockDate) {
      toast({
        title: "Validation Error",
        description: "Please select a date for one-time block",
        variant: "destructive",
      });
      return;
    }

    if (!tokens?.accessToken) return;

    setIsBlocking(true);

    try {
      const payload: any = {
        start_time: blockStartTime,
        end_time: blockEndTime,
        is_recurring: isRecurring,
        day_of_week: day,
        token: tokens.accessToken,
      };

      if (blockReason) {
        payload.reason = blockReason;
      }

      if (!isRecurring && blockDate) {
        payload.date = format(blockDate, "yyyy-MM-dd");
      }

      await BlockDoctorSlotApi(payload);

      toast({
        title: "Slot Blocked",
        description: `Successfully blocked ${blockStartTime} - ${blockEndTime} on ${day}`,
      });

      // Reset blocking form
      setBlockStartTime("");
      setBlockEndTime("");
      setBlockReason("");
      setBlockDate(undefined);

      // Refresh schedule (you may want to trigger a refetch)
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to block slot",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblockSlot = async (blockedSlotId: string) => {
    if (!tokens?.accessToken) return;

    try {
      await UnblockDoctorSlotApi({
        blocked_slot_id: blockedSlotId,
        token: tokens.accessToken,
      });

      toast({
        title: "Slot Unblocked",
        description: "Successfully unblocked the time slot",
      });

      onClose();
    } catch (error: any) {
      const message =
                error?.response?.data?.detail || 
                error?.response?.data?.message || "Something went wrong";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-indigo-900">
            Manage Schedule for {day}
          </DialogTitle>
          <DialogDescription>
            Set working hours and manage blocked time slots
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Working Hours</TabsTrigger>
            <TabsTrigger value="blocks">Block Slots</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <Label className="font-medium">Mark as Off Day</Label>
              <Switch checked={isOffDay} onCheckedChange={handleToggleOffDay} />
            </div>

            {!isOffDay && (
              <div className="space-y-4">
                <SlotTimePicker
                  label="Start Time"
                  value={startTime}
                  onChange={setStartTime}
                  slotDuration={Number(slotDuration)}
                />

                <SlotTimePicker
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime}
                  slotDuration={Number(slotDuration)}
                  disabled={!startTime}
                  minTime={startTime}
                />

                {slots.length > 0 && (
                  <div className="border border-indigo-200 rounded-md p-3 bg-indigo-50 max-h-48 overflow-y-auto">
                    <Label className="text-sm font-medium text-indigo-900">
                      Preview: {slots.length} slots will be created
                    </Label>
                    <div className="mt-2 text-xs text-gray-600">
                      First: {slots[0]} | Last: {slots[slots.length - 1]}
                    </div>
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
          </TabsContent>

          <TabsContent value="blocks" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <Label className="font-medium">Recurring Weekly Block</Label>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>

              {!isRecurring && (
                <div className="flex flex-col gap-2">
                  <Label>Select Date (One-Time Block)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {blockDate ? format(blockDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={blockDate}
                        onSelect={setBlockDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <SlotTimePicker
                label="Block Start Time"
                value={blockStartTime}
                onChange={setBlockStartTime}
                slotDuration={Number(slotDuration)}
              />

              <SlotTimePicker
                label="Block End Time"
                value={blockEndTime}
                onChange={setBlockEndTime}
                slotDuration={Number(slotDuration)}
                disabled={!blockStartTime}
                minTime={blockStartTime}
              />

              <div className="flex flex-col gap-2">
                <Label>Reason (Optional)</Label>
                <Input
                  placeholder="e.g., Lunch break, Meeting"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>

              <Button
                onClick={handleBlockSlot}
                disabled={isBlocking}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isBlocking ? "Blocking..." : "Block Slot"}
              </Button>
            </div>

            {/* Show existing blocked slots */}
            {existingData?.blockedSlots && existingData.blockedSlots.length > 0 && (
              <div className="mt-6 space-y-2">
                <Label className="text-sm font-semibold">Current Blocked Slots:</Label>
                {existingData.blockedSlots.map((bs: any) => (
                  <div
                    key={bs.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700">
                        🔒 {bs.start_time} - {bs.end_time}
                      </p>
                      {bs.reason && (
                        <p className="text-xs text-gray-600">{bs.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnblockSlot(bs.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorScheduleDialog;
