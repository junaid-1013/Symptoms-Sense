'use client';
import { Clock4 } from "lucide-react"
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMemo, useState } from 'react';
import { Calendar } from 'react-date-range';
import Swal from 'sweetalert2';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    addDays,
    addHours,
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
    startOfWeek,
} from 'date-fns';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

import { cn } from './datepicker/libs/utils';
import { useSearchParams } from "next/navigation";
const DoctorDetail = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    let id = searchParams.get("id");
    let name = searchParams.get("name");
    let img = searchParams.get("img");
    let city = searchParams.get("city");
    let address = searchParams.get("streetAddress");
    let res: any = searchParams.get("reserveTime");
    const reserveTime: string[] = res ? res.split('*') : [];
    let spec = searchParams.get("specialization");
    const specialization: string[] = spec!.split('*');
    let educ = searchParams.get("education");
    const education: string[] = educ!.split('*');
    let exp = searchParams.get("experience");
    const experience: string[] = exp!.split('*');
    let ser:any = searchParams.get("services");
    const services: string[] = ser ? ser.split('*'): [];
    let about = searchParams.get("about");
    let experienceYears = searchParams.get("experienceYears");
    let fed :any= searchParams.get("fed");
    const feedbacks: string[]|any = fed?fed.split('*'):[];
    let user :any= searchParams.get("user");
    const users: string[]|any = user?user.split('*'):[];
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
    const reservations = reserveTime.map(time => {
        return addDays(addHours(new Date(time), 0), 0).toString();
    });

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
    }, [selectedDate]);


    interface AppointmentData {
        time: Date;
        id: string | null;
        doctor: string | null;
    }
    const onSubmit = async () => {

        try {

            const data: AppointmentData = {
                time: selectedTime,
                id: id,
                doctor: name,
            };
            if (selected != 's') {
                throw new Error('Please select the time for the appointment');
            }
            const response = await axios.post("/api/appointment", data);
            Swal.fire('Success!', 'Appointment booked successfully!', 'success');
            router.push('/profile')

        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.error) {
                Swal.fire('Failed!', error.response.data.error, 'error');
                router.push('/login')
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'please select time for the appointment',
                    showConfirmButton: false, 
                    timer: 2000  
                });
            }

        } finally {

        }
    }

    return (
        <section>
            <div className="max-w-[1170px] px-5 mx-auto grid grid-cols-5 gap-8 py-8">
                <div className="relative block md:col-span-3 md:space-y-0 col-span-5 space-y-4">
                    <div className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg">
                        <div className="flex gap-5">
                            <div className="block shrink-0">
                                {img && (
                                    <img
                                        alt="Dr. Imad ud din Yousaf Butt"
                                        src={img}
                                        className="h-28 w-28 rounded-full object-cover shadow-lg"
                                    />
                                )}

                            </div>
                            {specialization && education && experience && experienceYears && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                        {name}
                                    </h3>

                                    <p className="mt-1 text-xs font-medium text-gray-600">{specialization[0]}</p>
                                    <div className="mt-4">
                                        <p className="max-w-[40ch] text-sm text-gray-500">
                                            {education[0]}
                                        </p>
                                    </div>

                                    <dl className="mt-6 flex gap-4 sm:gap-6">
                                        <div className="flex flex-col-reverse">
                                            <dt className="text-sm font-medium text-gray-600">Experience</dt>
                                            <dd className="text-xs text-gray-500">{experienceYears} Years</dd>
                                        </div>
                                    { /*   <div className="flex flex-col-reverse">
                                            <dt className="text-sm font-medium text-gray-600">Satisfied Patients</dt>
                                            <dd className="text-xs text-gray-500">2913</dd>
                            </div>*/}
                                    </dl>
                                </div>
                            )}
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
                                    <p className="text-sm font-semibold">{address + " , "}{city}</p>
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
                                                with {name}
                                            </DialogDescription>
                                        </DialogHeader>

                                        <Calendar
                                            className="w-full"
                                            color="#000"
                                            minDate={minSelectableDate}
                                            date={selectedDate}
                                            onChange={handleDateSelect}
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

                    <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                        <div className="flex gap-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    Services
                                </h3>
                                <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm columns-2 " style={{ "columnGap": "130px" }}>
                                    {
                                        services.map((data, index) => (
                                            <li key={index}>
                                                {data}
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />

                    <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                        <div className="flex gap-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    Education
                                </h3>
                                <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                                    {
                                        education.map((data, index) => (
                                            <li key={index}>
                                                {data}
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />

                    <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                        <div className="flex gap-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    Specialization
                                </h3>
                                <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                                    {
                                        specialization.map((data, index) => (
                                            <li key={index}>
                                                {data}
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />

                    <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                        <div className="flex gap-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    Experience
                                </h3>
                                <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                                    {
                                        experience.map((data, index) => (
                                            <li key={index}>
                                                {data}
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />

                    <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                        <div className="flex gap-5 text-sm">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    About
                                </h3>

                                <p className="mt-8 my-4">{about}</p>

                            </div>
                        </div>
                    </div>
                    <div >
            < section className="bg-white" >
                <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Reviews
                    </h2>
                    <div className="mt-8 [column-fill:_balance] sm:columns-2 sm:gap-6 lg:columns-2 lg:gap-8">
                        {feedbacks.map((data:any, index:any) => (
                                <div key={index} className="mb-8 sm:break-inside-avoid">
                                    <blockquote className="rounded-lg bg-gray-50 p-6 shadow-sm sm:p-8">
                                        <div className="flex items-center gap-4">
                                            <img
                                                alt="Man"
                                                src="/user.png"
                                                className="h-14 w-14 rounded-full object-cover"
                                            />
                                            <div>
                                                <div className="flex justify-center gap-0.5 text-[#facc15]">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="#facc15"
                                                    >
                                                        <path
                                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                        />
                                                    </svg>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="#facc15"
                                                    >
                                                        <path
                                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                        />
                                                    </svg>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="#facc15"
                                                    >
                                                        <path
                                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                        />
                                                    </svg>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="#facc15"
                                                    >
                                                        <path
                                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                        />
                                                    </svg>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="#facc15"
                                                    >
                                                        <path
                                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                        />
                                                    </svg>
                                                </div>
                                                <p className="mt-0.5 text-lg font-medium text-gray-900">{users[index]}</p>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-gray-700">
                                             {data}
                                        </p>
                                        
                                    </blockquote>
                                </div>
                            ))}
                    </div>
                </div>
            </section >
            
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
                                <p className="text-sm font-semibold">{address + " , "}{city}</p>
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
                                            with {name}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <Calendar
                                        className="w-full"
                                        color="#000"
                                        minDate={minSelectableDate}
                                        date={selectedDate}
                                        onChange={handleDateSelect}
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

                    {/*   <div className="hidden md:block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
                        <div className="flex flex-col gap-y-8">
                            <div className="flex w-full items-center justify-between">
                                <div className="w-[60%] flex items-center gap-x-4">
                                    <FaHospitalAlt className="text-[#ff9e15] w-6 h-6" />
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl w-full">
                                        Fatima Memorial Hospital
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
                                    <Link href="https://maps.google.com/maps?travelmode=driving&daddr=31.53566936,74.32814379"
                                        className="truncate underline underline-offset-1"
                                    >
                                        Fatima Memorial Hospital, Shadman, Lahore
                                    </Link>
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
                    */}
                </div>
            </div>
        </section>
    )
}

export default DoctorDetail