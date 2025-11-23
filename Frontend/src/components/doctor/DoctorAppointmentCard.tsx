"use client";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DoctorAppointmentCardProps } from "@/types";
import { CalendarCheck, Clock4, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import CompleteAppointment from "@/components/doctor/CompleteAppointment";
import React from "react";

const DoctorAppointmentCard: React.FC<DoctorAppointmentCardProps> = ({ 
    item, 
    appointmentId,
    status,
    className,
    onApprove,
    onCancel
}) => {
    const showActions = status === "pending";

    return (
        <Card className={`${className} relative`}>
            {showActions && (onApprove || onCancel) && (
                <div className="absolute top-3 right-3 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-indigo-100"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {onApprove && (
                                <DropdownMenuItem 
                                    onClick={() => onApprove(appointmentId)}
                                    className="cursor-pointer text-green-600 focus:text-green-600 focus:bg-green-50"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                </DropdownMenuItem>
                            )}
                            {onCancel && (
                                <DropdownMenuItem 
                                    onClick={() => onCancel(appointmentId)}
                                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <CardHeader className="flex flex-col items-center space-y-3 text-center p-5">
                <div className="relative flex justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-200 to-blue-300 opacity-30 blur-md" />
                    </div>
                    <Avatar className="h-16 w-16 ring-2 ring-indigo-300 shadow-md relative z-10 bg-white">
                        <AvatarImage
                            src={
                                item.gender === "Male"
                                    ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(item.patientName)}`
                                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.patientName)}`
                            }
                            alt={item.patientName}
                            className="rounded-full object-cover transition-all duration-500 hover:scale-105"
                        />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                            {item.patientName.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <CardTitle className="text-lg font-semibold text-gray-900">
                    {item.patientName}
                </CardTitle>
                <p className="text-sm text-gray-600">
                    {item.gender}, {item.age} years
                </p>
            </CardHeader>

            <CardContent className="text-sm text-gray-700 space-y-3 pb-5">
                <p className="text-center italic text-gray-600 bg-white/70 p-2 rounded-xl border border-indigo-100 shadow-sm">
                    “{item.reason}”
                </p>
                <div className="flex justify-around items-center pt-3 border-t border-indigo-100">
                    <div className="flex flex-col items-center text-indigo-700">
                        <CalendarCheck className="h-4 w-4 mb-1" />
                        <span>{item.date}</span>
                    </div>
                    <div className="flex flex-col items-center text-indigo-700">
                        <Clock4 className="h-4 w-4 mb-1" />
                        <span>
                            {new Date(item.time).toLocaleTimeString("en-US", {
                                timeZone: "Asia/Karachi",
                            })}
                        </span>
                    </div>
                </div>
                {status === "scheduled" &&  (
                    <div className="mt-4">
                        <CompleteAppointment 
                            appointmentId={appointmentId}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DoctorAppointmentCard;