'use client';
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { GetDoctorDetailApi } from "@/endPoints/doctor.endPoints";
import { cn } from '@/lib/utils';
import axios from "axios";
import {
    addDays,
    eachDayOfInterval,
    eachMinuteOfInterval,
    endOfDay,
    endOfMonth,
    endOfWeek,
    format,
    isSameMinute,
    parse,
    parseISO,
    set,
    startOfDay,
    startOfToday,
    startOfWeek
} from 'date-fns';
import { Clock4 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from 'react';
import 'react-clock/dist/Clock.css';
import { FaHospitalAlt } from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import 'react-time-picker/dist/TimePicker.css';

interface DoctorData {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string;
    specializations: string[];
    license_no: string;
    experience_years: number;
    bio: string;
    services: string[];
    education: string[];
    experience: string[];
    clinic_id: string;
    clinic_name: string;
    clinic_address: string;
    status: string;
    created_at: string;
}

const DoctorDetail = () => {
    const router = useRouter();
    const { toast } = useToast()
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [selected, setSelected] = useState('')

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    const minSelectableDate = addDays(new Date(), 0);

    let today = startOfToday();
    let [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'));
    let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', selectedDate);
    let days = eachDayOfInterval({
        start: startOfWeek(firstDayCurrentMonth, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(firstDayCurrentMonth), { weekStartsOn: 1 }),
    });

    const handleTimeClick = (time: Date) => {
        setSelectedTime(time);
        setSelected('s');
    };

    let [freeTimes, setFreeTimes] = useState<Date[]>([]);
    const [reservations, setReservations] = useState<string[]>([]);

    useMemo(() => {
        const StartOfToday = startOfDay(selectedDate);
        const endOfToday = endOfDay(selectedDate);
        const startHour = set(StartOfToday, { hours: 10 });
        const endHour = set(endOfToday, { hours: 18, minutes: 15 });
        let hoursInDay = eachMinuteOfInterval(
            {
                start: startHour,
                end: endHour,
            },
            { step: 60 }
        );

        let freeTimes = hoursInDay.filter(
            (hour) => !reservations.includes(parseISO(hour.toISOString()).toString())
        );
        setFreeTimes(freeTimes);
    }, [selectedDate, reservations]);


    interface AppointmentData {
        time: Date;
        id: string | null;
        doctor: string | null;
    }
    const onSubmit = async () => {
        try {
            if (!doctorData) {
                toast({
                    title: "Error",
                    description: "Doctor data not loaded",
                    variant: "destructive",
                });
                return;
            }

            const data: AppointmentData = {
                time: selectedTime,
                id: doctorData.id,
                doctor: doctorData.name,
            };
            if (selected != 's') {
                throw new Error('Please select the time for the appointment');
            }
            const response = await axios.post("/api/appointment", data);
            toast({
                title: "Success!",
                description: "Appointment booked successfully!",
            })
            router.push('/profile')

        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.error) {
                toast({
                    title: "Failed!",
                    description: error.response.data.error,
                    variant: "destructive",
                })
                router.push('/login')
            } else {
                toast({
                    title: "Error",
                    description: "please select time for the appointment",
                    variant: "destructive",
                })
            }
        }
    }

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        GetDoctorDetailApi({ doctor_id: id })
            .then((res) => {
                if (res.data.status === 'success' && res.data.data) {
                    const data = res.data.data;
                    setDoctorData(data);
                    setReservations([]);
                }
            })
            .catch((error) => {
                console.error('Error fetching doctor details:', error);
                toast({
                    title: "Error",
                    description: "Failed to load doctor details",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id, toast]);

    if (loading) {
        return (
            <div className="max-w-[1170px] px-5 mx-auto py-20 text-center">
                <p className="text-xl text-gray-600">Loading doctor details...</p>
            </div>
        );
    }

    if (!doctorData) {
        return (
            <div className="max-w-[1170px] px-5 mx-auto py-20 text-center">
                <p className="text-xl text-red-600">Doctor not found</p>
            </div>
        );
    }

    return (
        <section>
            <div className="max-w-[1170px] px-5 mx-auto grid grid-cols-5 gap-8 py-8">
                <div className="relative block md:col-span-3 md:space-y-0 col-span-5 space-y-4">
                    <div className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg">
                        <div className="flex gap-5">
                            <div className="block shrink-0">
                                <Image
                                    alt={doctorData.name}
                                    src="/doctor-placeholder2.svg"
                                    width={112}
                                    height={112}
                                    className="h-28 w-28 rounded-full object-cover shadow-lg"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    {doctorData.name}
                                </h3>

                                <p className="mt-1 text-xs font-medium text-gray-600">
                                    {doctorData.specializations && doctorData.specializations.length > 0
                                        ? doctorData.specializations.join(', ')
                                        : 'No specialization'}
                                </p>
                                <div className="mt-4">
                                    <p className="max-w-[40ch] text-sm text-gray-500">
                                        {doctorData.education && doctorData.education.length > 0
                                            ? doctorData.education[0]
                                            : 'No education info'}
                                    </p>
                                </div>

                                <dl className="mt-6 flex gap-4 sm:gap-6">
                                    <div className="flex flex-col-reverse">
                                        <dt className="text-sm font-medium text-gray-600">Experience</dt>
                                        <dd className="text-xs text-gray-500">{doctorData.experience_years} Years</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    <div className="relative block md:col-span-2 col-span-5 space-y-6">
                        <div className="md:hidden block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
                            <div className="flex flex-col gap-y-8">
                                <div className="flex w-full items-center justify-between">
                                    <div className="w-[60%] flex items-center">

                                        <h3 className="text-lg font-bold text-gray-900 sm:text-xl w-full">
                                            Appointment Booking
                                        </h3>
                                    </div>

                                    <span className="box w-[30%] p-2 text-[10px] font-semibold text-[#232426] text-center rounded bg-[#000066]/10">
                                        Receive Expert Care In-Person
                                    </span>

                                </div>
                                <div className="flex justify-between">
                                    <p className="text-sm">Fee:</p>
                                    <p className="text-sm font-semibold">Rs. 1500</p>
                                </div>
                                <hr className="-mt-6" />

                                <div className="flex justify-between">
                                    <p className="text-sm">Address:</p>
                                    <p className="text-sm font-semibold">{doctorData.clinic_address}</p>
                                </div>
                                <hr className="-mt-6" />

                                <div className="flex justify-between">
                                    <p className="flex gap-x-2 text-sm text-[#2a872e] font-semibold"><Clock4 className="w-5 h-5" />Online Hours</p>
                                    <p className="text-sm font-semibold">10:00 AM - 7:00 PM </p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex gap-x-2 py-4 bg-[#192a56] text-white font-semibold justify-center rounded items-center hover:bg-[#192a56]/90">

                                            Book Appointment
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Book Appointment</DialogTitle>
                                            <DialogDescription>
                                                with {doctorData.name}
                                            </DialogDescription>
                                        </DialogHeader>

                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => date && handleDateSelect(date)}
                                            disabled={(date) => date < minSelectableDate}
                                            className="rounded-md border"
                                        />

                                        <div className="flex flex-col items-center gap-2 mt-4 p-4">
                                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6  text-md gap-2">
                                                {
                                                    freeTimes.map((hour, hourIdx) => {
                                                        return (
                                                            <div key={hourIdx}>
                                                                <button
                                                                    type="button"
                                                                    className={cn(
                                                                        'bg-green-200 rounded-lg px-2 text-gray-800 relative hover:border hover:border-green-400 w-[60px] h-[26px]',
                                                                        selectedTime &&
                                                                        isSameMinute(selectedTime, hour) &&
                                                                        'bg-black text-white',
                                                                        // isDisabled && 'bg-gray-400 cursor-not-allowed'
                                                                    )}
                                                                    onClick={() => handleTimeClick(hour)}
                                                                >
                                                                    {format(hour, 'HH:mm')}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <button
                                                    type="button"
                                                    className="py-3 text-base font-medium px-7 border border-[#273c75] text-[#273c75] rounded-lg hover:text-white hover:bg-[#273c75] "
                                                >
                                                    Close
                                                </button>
                                            </DialogClose>
                                            <button
                                                type="submit"
                                                className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80 cursor-pointer"
                                                onClick={onSubmit}

                                            >
                                                Book Appointment
                                            </button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>

                    {/* Services Section */}
                    {doctorData.services && doctorData.services.length > 0 && (
                        <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                        md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                            <div className="flex gap-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                        Services
                                    </h3>
                                    <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm columns-2" style={{ columnGap: "130px" }}>
                                        {doctorData.services.map((service, index) => (
                                            <li key={index}>
                                                {service}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />

                    {/* Education Section */}
                    {doctorData.education && doctorData.education.length > 0 && (
                        <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                        md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                            <div className="flex gap-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                        Education
                                    </h3>
                                    <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                                        {doctorData.education.map((edu, index) => (
                                            <li key={index}>
                                                {edu}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />

                    {/* Specialization Section */}
                    {doctorData.specializations && doctorData.specializations.length > 0 && (
                        <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                        md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                            <div className="flex gap-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                        Specialization
                                    </h3>
                                    <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                                        {doctorData.specializations.map((spec, index) => (
                                            <li key={index}>{spec}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />

                    {/* Experience Details Section */}
                    {doctorData.experience && doctorData.experience.length > 0 && (
                        <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                        md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                            <div className="flex gap-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                        Experience
                                    </h3>
                                    <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                                        {doctorData.experience.map((exp, index) => (
                                            <li key={index}>
                                                {exp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />

                    {/* About Section (Bio) */}
                    {doctorData.bio && (
                        <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                        md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                            <div className="flex gap-5 text-sm">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                        About
                                    </h3>
                                    <div
                                        className="mt-4 my-4 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: doctorData.bio }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews section */}
                    <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                        <div className="flex gap-5">
                            <div className="w-full">
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    Reviews
                                </h3>
                                <p className="mt-4 text-gray-500 text-sm">No reviews available yet.</p>
                            </div>
                        </div>
                    </div>



                </div>

                {/* Appointment booking divs */}
                <div className="relative block md:col-span-2 col-span-5 space-y-6">
                    <div className="hidden md:block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
                        <div className="flex flex-col gap-y-8">
                            <div className="flex w-full items-center justify-between">
                                <div className="w-[60%] flex items-center">

                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl w-full">
                                        Appointment Booking
                                    </h3>
                                </div>

                                <span className="box w-[30%] p-2 text-[10px] font-semibold text-[#232426] text-center rounded bg-[#000066]/10">
                                    Receive Expert Care In-Person
                                </span>

                            </div>
                            <div className="flex justify-between">
                                <p className="text-sm">Fee:</p>
                                <p className="text-sm font-semibold">Rs. 1500</p>
                            </div>
                            <hr className="-mt-6" />

                            <div className="flex justify-between">
                                <p className="text-sm">Address:</p>
                                <p className="text-sm font-semibold">{doctorData.clinic_address}</p>
                            </div>
                            <hr className="-mt-6" />

                            <div className="flex justify-between">
                                <p className="flex gap-x-2 text-sm text-[#2a872e] font-semibold"><Clock4 className="w-5 h-5" />Online Hours</p>
                                <p className="text-sm font-semibold">10:00 AM - 7:00 PM </p>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="flex gap-x-2 py-4 bg-[#192a56] text-white font-semibold justify-center rounded items-center hover:bg-[#192a56]/90">

                                        Book Appointment
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Book Appointment</DialogTitle>
                                        <DialogDescription>
                                            with {doctorData.name}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && handleDateSelect(date)}
                                        disabled={(date) => date < minSelectableDate}
                                        className="rounded-md border"
                                    />

                                    <div className="flex flex-col items-center gap-2 mt-4 p-4">
                                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6  text-md gap-2">
                                            {
                                                freeTimes.map((hour, hourIdx) => {
                                                    return (
                                                        <div key={hourIdx}>
                                                            <button
                                                                type="button"
                                                                className={cn(
                                                                    'bg-green-200 rounded-lg px-2 text-gray-800 relative hover:border hover:border-green-400 w-[60px] h-[26px]',
                                                                    selectedTime &&
                                                                    isSameMinute(selectedTime, hour) &&
                                                                    'bg-black text-white',
                                                                    // isDisabled && 'bg-gray-400 cursor-not-allowed'
                                                                )}
                                                                onClick={() => handleTimeClick(hour)}
                                                            >
                                                                {format(hour, 'HH:mm')}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <button
                                                type="button"
                                                className="py-3 text-base font-medium px-7 border border-[#273c75] text-[#273c75] rounded-lg hover:text-white hover:bg-[#273c75] "
                                            >
                                                Close
                                            </button>
                                        </DialogClose>
                                        <button
                                            type="submit"
                                            className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80 cursor-pointer"
                                            onClick={onSubmit}

                                        >
                                            Book Appointment
                                        </button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Secondary clinic location */}

                    <div className="hidden md:block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
                        <div className="flex flex-col gap-y-8">
                            <div className="flex w-full items-center justify-between">
                                <div className="w-[60%] flex items-center gap-x-4">
                                    <FaHospitalAlt className="text-[#ff9e15] w-6 h-6" />
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl w-full">
                                        {doctorData.clinic_name}
                                    </h3>
                                </div>
                                <span className="box w-[30%] p-2 text-[10px] font-semibold text-[#232426] text-center rounded bg-[#000066]/10">
                                    Pay Online & Get Rs. 400 OFF
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <p className="text-sm">Fee:</p>
                                <p className="text-sm font-semibold">Rs. 2500</p>
                            </div>
                            <hr className="-mt-6" />

                            <div className="flex justify-between">
                                <p className="text-sm">Address:</p>
                                <p className="text-sm font-semibold flex gap-x-2 items-center">
                                    <MdOutlineLocationOn className="w-5 h-5" />
                                    <span>{doctorData.clinic_address}</span>
                                </p>
                            </div>
                            <hr className="-mt-6" />

                            <div className="flex justify-between">
                                <p className="flex gap-x-2 text-sm text-[#2a872e] font-semibold"><Clock4 className="w-5 h-5" />Available today</p>
                                <p className="text-sm font-semibold">10:00 PM - 11:00 PM </p>
                            </div>

                            <button className="py-4 bg-[#ff9e15] text-white justify-center rounded hover:bg-[#ff9e15]/90 font-semibold">
                                Book Appointment
                            </button>
                        </div>
                    </div>


                </div>
            </div>
        </section>
    )
}

export default DoctorDetail