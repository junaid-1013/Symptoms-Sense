"use client";
import img from "../../public/user.png";
import Image from "next/image";
import { Clock4, CalendarCheck } from "lucide-react";

const appointmentsData = {
    'Upcoming Appointments': [
        { name: 'Dr ABC', specialty: 'Heart Problem', time: '4:00 pm', date: '29 December 2023' },
        { name: 'Dr DEF', specialty: 'Dental Checkup', time: '2:30 pm', date: '31 December 2023' },
        { name: 'Dr GHI', specialty: 'Eye Exam', time: '3:45 pm', date: '5 January 2024' },
        { name: 'Dr JKL', specialty: 'Allergy Consultation', time: '1:15 pm', date: '10 January 2024' },
        { name: 'Dr MNO', specialty: 'Orthopedic Appointment', time: '11:00 am', date: '15 January 2024' },
    ],
    'Previous Appointments': [
        { name: 'Dr XYZ', specialty: 'Back Pain', time: '2:30 pm', date: '15 December 2023' },
        { name: 'Dr PQR', specialty: 'Flu Shot', time: '10:45 am', date: '10 December 2023' },
        { name: 'Dr STU', specialty: 'Physical Therapy', time: '3:00 pm', date: '5 December 2023' },
        { name: 'Dr VWX', specialty: 'Dermatology Checkup', time: '1:30 pm', date: '1 December 2023' },
        { name: 'Dr YZA', specialty: 'Blood Pressure Check', time: '9:15 am', date: '25 November 2023' },
    ],
};


const DoctorProfile = () => {
    return (
        <section>
            <div className="max-w-[1170px] px-5 mx-auto grid grid-cols-5 gap-8 py-8">
                <div className="relative block md:col-span-3 md:space-y-0 col-span-5 space-y-4">
                    <div className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
                        md:col-span-3 col-span-5 shadow-lg">
                        <div className="flex gap-5">
                            <div className="block shrink-0">
                                <Image
                                    alt="Dr. Imad ud din Yousaf Butt"
                                    src={img}
                                    className="h-28 w-28 rounded-full object-cover shadow-lg"
                                />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    Dr ABC
                                </h3>

                                <p className="mt-1 text-xs font-medium text-gray-600">Heart Specialist</p>
                                <div className="mt-4">
                                    <p className="max-w-[40ch] text-sm text-gray-500">
                                        12
                                    </p>
                                </div>

                                <dl className="mt-6 flex gap-4 sm:gap-6">
                                    <div className="flex flex-col-reverse">
                                        <dt className="text-sm font-medium text-gray-600">Experience</dt>
                                        <dd className="text-xs text-gray-500">4 Years</dd>
                                    </div>
                                    <div className="flex flex-col-reverse">
                                        <dt className="text-sm font-medium text-gray-600">Satisfied Patients</dt>
                                        <dd className="text-xs text-gray-500">2913</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            {Object.entries(appointmentsData).map(([category, appointments], index) => (
                <div key={index}>
                    <div className="inline-flex items-center justify-center w-full px-8 md:px-12 xl:px-32 lg:px-20">
                        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            {category}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-x-4 md:px-16 px-4 justify-center py-8 gap-y-4">
                        {appointments.map((appointment, subIndex) => (
                            <div key={subIndex} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
                                <div className="flex gap-5">
                                    <div className="block shrink-0">
                                        <Image alt={appointment.name} src={img} className="h-12 w-12 rounded-full object-cover shadow-lg" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 sm:text-xl">{appointment.name}</h3>
                                        <p className="mt-1 text-xs font-medium text-gray-600">{appointment.specialty}</p>
                                        <dl className="mt-6 flex gap-4 sm:gap-6">
                                            <div className="flex flex-col items-center">
                                                <dt className="text-sm font-medium text-gray-600 flex items-center gap-x-1">
                                                    <Clock4 className="w-4 h-4" />
                                                    Time
                                                </dt>
                                                <dd className="text-xs text-gray-500">{appointment.time}</dd>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <dt className="text-sm font-medium text-gray-600 flex items-center gap-x-1">
                                                    <CalendarCheck className="w-4 h-4" />
                                                    Date
                                                </dt>
                                                <dd className="text-xs text-gray-500">{appointment.date}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

        </section>
    );
};

export default DoctorProfile;