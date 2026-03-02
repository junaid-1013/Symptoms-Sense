"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Edit } from "lucide-react";
import { useUser } from "@/contextApis/UserContext";
import DoctorScheduleDialog from "./DoctorScheduleDialog";
import { useToast } from "@/components/ui/use-toast";
import { SpinnerButton } from "../uiUtils/SpinnerButton";
import { BulkUpdateDoctorScheduleApi, GetDoctorWeeklyScheduleApi } from "@/endPoints/doctor.endPoints";
import { DAYS } from "@/config/constants";

const WeeklyScheduleTable = () => {

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [localSlotDuration, setLocalSlotDuration] = useState("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { tokens, setDoctorSchedule, doctorSchedule } = useUser();
  const { toast } = useToast();

  // Slot duration is derived from local state or from schedule items' embedded value
  const slotDuration = localSlotDuration;

  const [scheduleData, setScheduleData] = useState<
    { 
      day: string; 
      slots?: string[]; 
      start_time?: string; 
      end_time?: string; 
      slot_duration?: string;
      startHour?: string;
      endHour?: string;
      offDay: boolean;
      blockedSlots?: Array<{
        id: string;
        start_time: string;
        end_time: string;
        reason?: string;
      }> | null;
    }[]
  >(doctorSchedule || []);

  // Initialize local slot duration from existing schedule (embedded) on mount and when schedule changes
  useEffect(() => {
    if (doctorSchedule && doctorSchedule.length > 0) {
      const first = doctorSchedule.find(Boolean) as any;
      if (first && (first.slotDuration || first.slot_duration)) {
        setLocalSlotDuration(String(first.slotDuration || first.slot_duration));
      }
    }
  }, [doctorSchedule]);

  // Fetch doctor schedule on component mount
  useEffect(() => {
    console.log(doctorSchedule);
    if (tokens?.accessToken && doctorSchedule === null) {
    setIsLoading(true);
      GetDoctorWeeklyScheduleApi()
        .then((response) => {
          if (response?.data?.data) {
            // The response contains doctor name as key, so we need to extract the schedule
            const scheduleKey = Object.keys(response.data.data).find(key => key !== 'message');
            if (scheduleKey) {
              const fetchedSchedule = response.data.data[scheduleKey];
              if (fetchedSchedule?.schedules) {
                const schedulesWithDuration = fetchedSchedule.schedules.map((s: any) => ({
                  ...s,
                  slotDuration: fetchedSchedule?.slotDuration ?? null,
                }));
                setDoctorSchedule(schedulesWithDuration);
                if (fetchedSchedule?.slotDuration) {
                  setLocalSlotDuration(String(fetchedSchedule.slotDuration));
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error("Failed to fetch schedule:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  // Sync local state with context when doctorSchedule changes
  useEffect(() => {
    if (doctorSchedule) {
      setScheduleData(doctorSchedule as any);
    }
  }, [doctorSchedule]);

  const handleEditClick = (day: string) => {
    if (!slotDuration) {
      toast({
        title: "Slot duration required",
        description: "Please enter slot duration before editing a day's schedule.",
        variant: "destructive",
      });
      return;
    }
    setSelectedDay(day);
    setOpen(true);
  };


  const closeDialog = () => {
    setOpen(false);
    setSelectedDay(null);
  };

  const handleScheduleSave = (savedData: any) => {
    setScheduleData((prev) => {
      const existingForDay = prev.find((item) => item.day === savedData.day);
      const normalized = {
        ...existingForDay,
        ...savedData,
        // Ensure display fields exist for immediate UI update
        startHour: savedData.start_time || savedData.startHour || "",
        endHour: savedData.end_time || savedData.endHour || "",
        // Keep blocked slots from existing entry if not provided
        blockedSlots: savedData.blockedSlots ?? existingForDay?.blockedSlots ?? null,
        // Embed duration on the item as well for consistency
        slotDuration: savedData.slot_duration || (localSlotDuration ? Number(localSlotDuration) : (existingForDay as any)?.slotDuration) || null,
      } as any;

      const filtered = prev.filter((item) => item.day !== normalized.day);
      const merged = [...filtered, normalized];
      // Update global context so it persists and other components see the change
      setDoctorSchedule(merged as any);
      return merged as any;
    });
    // Close dialog without refreshing (to avoid overwriting unsaved local changes)
    setOpen(false);
    setSelectedDay(null);
  };

  // Refresh schedule data
  const refreshSchedule = async () => {
    if (!tokens?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await GetDoctorWeeklyScheduleApi();
      if (response?.data?.data) {
        const scheduleKey = Object.keys(response.data.data).find(key => key !== 'message');
        if (scheduleKey) {
          const fetchedSchedule = response.data.data[scheduleKey];
          if (fetchedSchedule?.schedules) {
            const schedulesWithDuration = fetchedSchedule.schedules.map((s: any) => ({
              ...s,
              slotDuration: fetchedSchedule?.slotDuration ?? null,
            }));
            setDoctorSchedule(schedulesWithDuration);
            if (fetchedSchedule?.slotDuration) {
              setLocalSlotDuration(String(fetchedSchedule.slotDuration));
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to refresh schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSave = () => {
    if (!slotDuration) {
      toast({ title: "Slot Duration Missing", variant: "destructive" });
      return;
    }

    setIsAdding(true);

    const payload = {
      slotDuration: Number(slotDuration),
      schedules: DAYS.map((day) => {
        const schedule = scheduleData.find((d) => d.day === day);

        if (!schedule || schedule.offDay) {
            return {
              day,
              offDay: true,
            };
          }
        return {
          day,
          startHour: schedule.start_time || schedule.startHour, 
          endHour: schedule.end_time || schedule.endHour,
          offDay: schedule.offDay
        };

      })
    };

    BulkUpdateDoctorScheduleApi({
      slotDuration: payload.slotDuration,
      schedules: payload.schedules
    })
      .then(response => {
        if (response.data?.status=="error" || response.data?.error) {
          setIsAdding(false);
          toast({
            title: "Error",
            description: response.data?.message || response.data?.error ||"Failed to save schedule.",
            variant: "destructive",
          })
          return;
        }
        else if (response) {
          setIsAdding(false);
          if (response.data?.data?.schedules?.length) {
            const schedulesWithDuration = response.data.data.schedules.map((s: any) => ({
              ...s,
              slotDuration: Number(slotDuration)
            }));
            setDoctorSchedule(schedulesWithDuration);
            setLocalSlotDuration(String(slotDuration));
          }
          
          toast({
            title: "Weekly Schedule Updated",
            description: "Your schedule has been saved successfully.",
          });
        }
      })
      .catch(error => {
        setIsAdding(false);
        const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to save schedule.";

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
      })
  };

  return (
    <Card className="max-w-5xl mx-auto mt-10 shadow-lg border border-indigo-100 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
      <CardHeader className="text-center space-y-3">
        <CardTitle className="text-2xl font-semibold flex justify-center items-center gap-x-2 text-gray-900">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          Doctor Weekly Schedule
        </CardTitle>
        <CardDescription>
          {isLoading ? "Loading your schedule..." : "Set schedule slots for each day."}
        </CardDescription>

        {/* Slot Duration Input */}
        <div className="flex justify-center items-center gap-3 mt-2">
          <label className="text-indigo-700 font-medium">Slot Duration (mins):</label>
          <Input
            className="w-24 border-indigo-300 focus-visible:ring-indigo-400"
            type="number"
            value={localSlotDuration}
            onChange={(e) => setLocalSlotDuration(e.target.value)}
          />
        </div>
      </CardHeader>

      <Separator className="my-2" />

      <CardContent>
        <div className="overflow-x-auto">
          <Table className="w-full text-center border border-indigo-200">
            <TableHeader>
              <TableRow className="bg-indigo-100">
                {DAYS.map((day) => (
                  <TableHead key={day} className="border-r last:border-r-0 text-indigo-900 font-semibold text-center">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow className="border-t">
                {DAYS.map((day) => {
                  const daySchedule = scheduleData.find((s) => s.day === day);

                  return (
                    <TableCell key={day} className="py-6 border-r last:border-r-0 align-top">
                      <div className="flex flex-col items-center gap-2">
                        {daySchedule ? (
                          daySchedule.offDay ? (
                            <p className="text-red-600 font-medium italic">Day Off</p>
                          ) : daySchedule.startHour && daySchedule.endHour ? (
                            <div className="text-sm w-full">
                              <p className="text-gray-700 text-center py-2">
                                {daySchedule.startHour} - {daySchedule.endHour}
                              </p>
                              {daySchedule.blockedSlots && daySchedule.blockedSlots.length > 0 && (
                                <div className="mt-2 border-t pt-2">
                                  <p className="text-xs text-red-600 font-semibold mb-1">Blocked Slots:</p>
                                  {daySchedule.blockedSlots.map((bs, idx) => (
                                    <div key={idx} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-1">
                                      🔒 {bs.start_time} - {bs.end_time}
                                      {bs.reason && <span className="text-gray-600"> ({bs.reason})</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">No Schedule</p>
                          )
                        ) : (
                          <p className="text-gray-500 italic">No Schedule</p>
                        )}


                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(day)}
                          className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1 mt-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="text-center mt-6">
          <SpinnerButton
            name="Save All Schedules"
            state={isAdding}
            onClick={handleFinalSave}
            className="bg-blue-900 hover:bg-blue-800 text-white px-6"
          />
        </div>
      </CardContent>

      {selectedDay && (
        <DoctorScheduleDialog
          open={open}
          onClose={closeDialog}
          day={selectedDay}
          slotDuration={slotDuration}
          onSave={handleScheduleSave}
          existingData={scheduleData.find((s) => s.day === selectedDay) || null}
        />
      )}
    </Card>
  );
};

export default WeeklyScheduleTable;
