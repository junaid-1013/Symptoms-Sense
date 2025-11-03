"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScheduleCardProps } from "@/types";
import { CalendarDays } from "lucide-react";
import React from "react";

const ScheduleCard: React.FC<ScheduleCardProps> = ({
    selectedDate,
    onSelect,
    fromDate,
    onConfirm,
    title = "Reserve a Schedule",
    description = "Select your preferred date/time for the next slot.",
}) => {
    return (
        <Card className="max-w-lg mx-auto shadow-lg border border-indigo-100 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100 hover:from-indigo-100 hover:to-indigo-50 transition-all duration-500 ease-in-out">
            <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl font-semibold text-gray-900 flex justify-center items-center gap-x-2">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                    {title}
                </CardTitle>
                <CardDescription className="text-gray-500">
                    {description}
                </CardDescription>
            </CardHeader>

            <Separator className="my-2" />

            <CardContent className="flex flex-col items-center space-y-5">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={onSelect}
                    fromDate={fromDate}
                    className="rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-300"
                />
                <Button
                    className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                    onClick={onConfirm}
                >
                    Confirm Reservation
                </Button>
            </CardContent>
        </Card>
    );
};

export default ScheduleCard;