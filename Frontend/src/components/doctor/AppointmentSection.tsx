"use client";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { AppointmentSectionProps } from "@/types";
import React from "react";
import DoctorAppointmentCard from "./DoctorAppointmentCard";

const AppointmentSection: React.FC<AppointmentSectionProps> = ({
    title,
    data,
    cardClassName,
    sectionClassName,
}) => {
    return (
        <section className={`text-center space-y-6 ${sectionClassName ?? ""}`}>
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            <Separator className="w-24 mx-auto bg-indigo-200" />

            <Carousel className="w-full max-w-5xl mx-auto">
                <CarouselContent>
                    {data.map((a, i) => (
                        <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                            <DoctorAppointmentCard item={a} className={cardClassName} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </section>
    );
};

export default AppointmentSection;