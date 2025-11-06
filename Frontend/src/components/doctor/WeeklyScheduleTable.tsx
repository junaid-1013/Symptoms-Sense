"use client";

import { useState } from "react";
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
import { BulkUpdateDoctorScheduleApi } from "@/endPoints/doctor.endPoints";
import { DAYS } from "@/config/constants";

const WeeklyScheduleTable = () => {

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [slotDuration, setSlotDuration] = useState("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { tokens, setDoctorSchedule } = useUser();
  const { toast } = useToast();

  const [scheduleData, setScheduleData] = useState<
    { day: string; slots: string[]; start_time: string; end_time: string; slot_duration: string , offDay: boolean}[]
  >([]);

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
      const filtered = prev.filter((item) => item.day !== savedData.day);
      return [...filtered, savedData];
    });
  };

  const handleFinalSave = () => {
    if (!slotDuration) {
      toast({ title: "Slot Duration Missing", variant: "destructive" });
      return;
    }

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
          startHour: schedule.start_time, 
         endHour: schedule.end_time,
          offDay: schedule.offDay
        };

      })
    };

    BulkUpdateDoctorScheduleApi({
      slotDuration: payload.slotDuration,
      schedules: payload.schedules,
      token: tokens?.accessToken || ""
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
            setDoctorSchedule(response.data.data.schedules)
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
        <CardDescription>Set schedule slots for each day.</CardDescription>

        {/* Slot Duration Input */}
        <div className="flex justify-center items-center gap-3 mt-2">
          <label className="text-indigo-700 font-medium">Slot Duration (mins):</label>
          <Input
            className="w-24 border-indigo-300 focus-visible:ring-indigo-400"
            type="number"
            value={slotDuration}
            onChange={(e) => setSlotDuration(e.target.value)}
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
                    <TableCell key={day} className="py-6 border-r last:border-r-0">
                      <div className="flex flex-col items-center gap-2">
                        {daySchedule ? (
                          daySchedule.offDay ? (
                            <p className="text-red-600 font-medium italic">Day Off</p>
                          ) : daySchedule.slots.length > 0 ? (
                            <div className="text-sm text-gray-700 max-h-32 overflow-y-auto border border-indigo-200 p-1 rounded-md w-full">
                              {daySchedule.slots.map((slot, i) => (
                                <div key={i} className="py-0.5">{slot}</div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">No Slot</p>
                          )
                        ) : (
                          <p className="text-gray-500 italic">No Slot</p>
                        )}


                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(day)}
                          className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
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
