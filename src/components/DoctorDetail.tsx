import { Clock4 } from "lucide-react"
import Link from "next/link"
import { FaHospitalAlt } from "react-icons/fa"
import { MdOutlineLocationOn } from "react-icons/md"

const DoctorDetail = () => {
    return (
        <section>
            <div className="max-w-[1170px] px-5 mx-auto grid grid-cols-5 gap-8 py-8">
                <div className="relative block md:col-span-3 md:space-y-0 col-span-5 space-y-4">
                    <div className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg">
                        <div className="flex gap-5">
                            <div className="block shrink-0">
                                <img
                                    alt="Dr. Imad ud din Yousaf Butt"
                                    src="https://d1t78adged64l7.cloudfront.net/images/profile-pics/doctors/1615822541_f601c147-98f5-4e9a-92e6-44f3a490993f.webp?t=1657800451"
                                    className="h-28 w-28 rounded-full object-cover shadow-lg"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    Dr. Imad ud din Yousaf Butt
                                </h3>

                                <p className="mt-1 text-xs font-medium text-gray-600">Neurologist</p>
                                <div className="mt-4">
                                    <p className="max-w-[40ch] text-sm text-gray-500">
                                        MBBS (K.E), F.C.P.S. (Neurology)
                                    </p>
                                </div>

                                <dl className="mt-6 flex gap-4 sm:gap-6">
                                    <div className="flex flex-col-reverse">
                                        <dt className="text-sm font-medium text-gray-600">Experience</dt>
                                        <dd className="text-xs text-gray-500">9 Years</dd>
                                    </div>

                                    <div className="flex flex-col-reverse">
                                        <dt className="text-sm font-medium text-gray-600">Satisfied Patients</dt>
                                        <dd className="text-xs text-gray-500">2913</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                    {/* Appointment booking divs */}
                    <div className="relative block md:col-span-2 col-span-5 space-y-6">
                        <div className="block md:hidden overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
                            <div className="flex flex-col gap-y-8">
                                <div className="flex w-full items-center justify-between">
                                    <div className="w-[60%] flex items-center">
                                        <svg width="40" height="40" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                            <path d="M11.7946 10.674L11.0279 10.1905V11.0969V12.2093H5.22527V7.79068H11.0279V8.90304V9.80943L11.7946 9.32598L13.7078 8.11963V11.8803L11.7946 10.674ZM3.12612 3.65957L3.12608 3.65961C1.43355 5.3525 0.5 7.60576 0.5 9.99997C0.5 11.5678 0.906841 13.0978 1.68063 14.4496L0.54293 17.8627L0.542666 17.8635C0.443076 18.1639 0.520753 18.4959 0.745674 18.7208C0.905694 18.8808 1.1199 18.9665 1.33866 18.9665C1.42779 18.9665 1.51694 18.9522 1.60241 18.924L1.60379 18.9236L5.0169 17.7859C6.36868 18.5596 7.89872 18.9665 9.46652 18.9665C11.8607 18.9665 14.114 18.0333 15.8069 16.3404C17.4999 14.6474 18.433 12.3941 18.433 9.99997C18.433 7.6058 17.4999 5.35251 15.8069 3.65957C14.114 1.96663 11.8607 1.03345 9.46652 1.03345C7.07236 1.03345 4.81906 1.96663 3.12612 3.65957Z"
                                                fill="#192a56"
                                                stroke="white">
                                            </path>
                                        </svg>
                                        <h3 className="text-lg font-bold text-gray-900 sm:text-xl w-full">
                                            Online Video Consultation
                                        </h3>
                                    </div>
                                    <span className="box w-[30%] p-2 text-[10px] font-semibold text-[#232426] text-center rounded bg-[#000066]/10">
                                        Pay Online & Get Rs. 400 OFF
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-sm">Fee:</p>
                                    <p className="text-sm font-semibold">Rs. 1500</p>
                                </div>
                                <hr className="-mt-6" />

                                <div className="flex justify-between">
                                    <p className="text-sm">Address:</p>
                                    <p className="text-sm font-semibold">Use phone/laptop for video call</p>
                                </div>
                                <hr className="-mt-6" />

                                <div className="flex justify-between">
                                    <p className="flex gap-x-2 text-sm text-[#2a872e] font-semibold"><Clock4 className="w-5 h-5" />Available today</p>
                                    <p className="text-sm font-semibold">10:00 PM - 11:00 PM </p>
                                </div>

                                <button className="flex gap-x-2 py-4 bg-[#192a56] text-white font-semibold justify-center rounded items-center hover:bg-[#192a56]/90">
                                    <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.7946 10.674L11.0279 10.1905V11.0969V12.2093H5.22527V7.79068H11.0279V8.90304V9.80943L11.7946 9.32598L13.7078 8.11963V11.8803L11.7946 10.674ZM3.12612 3.65957L3.12608 3.65961C1.43355 5.3525 0.5 7.60576 0.5 9.99997C0.5 11.5678 0.906841 13.0978 1.68063 14.4496L0.54293 17.8627L0.542666 17.8635C0.443076 18.1639 0.520753 18.4959 0.745674 18.7208C0.905694 18.8808 1.1199 18.9665 1.33866 18.9665C1.42779 18.9665 1.51694 18.9522 1.60241 18.924L1.60379 18.9236L5.0169 17.7859C6.36868 18.5596 7.89872 18.9665 9.46652 18.9665C11.8607 18.9665 14.114 18.0333 15.8069 16.3404C17.4999 14.6474 18.433 12.3941 18.433 9.99997C18.433 7.6058 17.4999 5.35251 15.8069 3.65957C14.114 1.96663 11.8607 1.03345 9.46652 1.03345C7.07236 1.03345 4.81906 1.96663 3.12612 3.65957Z"
                                            fill="white"
                                            stroke="#192a56">
                                        </path>
                                    </svg>
                                    Book Video Consultation
                                </button>
                            </div>
                        </div>
                        <div className="block md:hidden overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
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
                    </div>

                    <div className="relative block overflow-hidden rounded-lg md:border-none border border-gray-100 p-4 sm:p-6 lg:p-8 
                    md:col-span-3 col-span-5 shadow-lg md:shadow-none">
                        <div className="flex gap-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    Services
                                </h3>
                                <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm columns-2 " style={{ "columnGap": "130px" }}>
                                    <li>
                                        ALS / Motor Neuron Disease
                                    </li>
                                    <li>
                                        ALS Treatment (ALS علاج)
                                    </li>
                                    <li>
                                        Alzheimer Disease
                                    </li>
                                    <li>
                                        Back Pain
                                    </li>
                                    <li>
                                        Bells Palsy
                                    </li>
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
                                    <li>
                                        MBBS (K.E) - King Edward Medical University,Lahore, Pakistan, 2013
                                    </li>
                                    <li>
                                        F.C.P.S. (Neurology) - College of Physicians & Surgeons
                                    </li>
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
                                    <li>
                                        Neurologist
                                    </li>
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
                                    <li>
                                        2021 - Present, Senior Registrar Neurology, Central Park Teaching, Hospital
                                    </li>
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
                                    About Dr. Imad ud din Yousaf Butt
                                </h3>

                                <p className="mt-8 my-4">Dr. Imad ud din Yousaf Butt is a Neurologist with 9 years of experience currently practicing at Fatima Memorial Hospital, Lahore. You can book an in-person appointment or an online video consultation with Dr. Imad ud din Yousaf Butt through Symptoms Sense or by calling at 04238900939.</p>

                                <div className="mb-6">
                                    <h2 className="font-semibold mb-2">Experience</h2>
                                    <p>Dr. Imad ud din Yousaf Butt has over 9 years of experience in his field.</p>
                                </div>

                                <div className="mb-6">
                                    <h2 className="font-semibold mb-2">Qualifications</h2>
                                    <ul className="list-disc list-inside pl-6">
                                        <li>MBBS (K.E)</li>
                                        <li>F.C.P.S. (Neurology)</li>
                                    </ul>
                                </div>

                                <div className="mb-6">
                                    <h2 className="font-semibold mb-2">Appointment Details</h2>
                                    <p>In order to book an appointment with Dr. Imad ud din Yousaf Butt, you can call 04238900939 or click the Book Appointment button. You can also book an online video consultation with Dr. Imad ud din Yousaf Butt by clicking the Video Consultation button.</p>
                                </div>

                                <div className="mb-6">
                                    <h2 className="font-semibold mb-2">Fees</h2>
                                    <p>The fee for Dr. Imad ud din Yousaf Butt ranges from Rs. 1,500 - 2,500 for appointments and video consultations.</p>
                                </div>

                                <div className="mb-6">
                                    <h2 className="font-semibold mb-2">Practice Locations</h2>
                                    <ul className="list-disc list-inside pl-6">
                                        <li>Online Video Consultation</li>
                                        <p className="font-semibold pl-5">Availability</p>
                                        <ul className="list-[circle] list-inside pl-12">
                                            <li>Days: M, Tu, W, Th, F, Sa, Su</li>
                                            <li>Time: 10:00 PM - 11:00 PM</li>
                                        </ul>
                                        <li>Fatima Memorial Hospital</li>
                                        <p className="font-semibold pl-5">Availability</p>
                                        <ul className="list-[circle] list-inside pl-12">
                                            <li>Days: M, Tu, W, F, Sa</li>
                                            <li>Time: 07:30 PM - 09:15 PM</li>
                                        </ul>
                                        <li>Central Park Teaching Hospital</li>
                                    </ul>
                                </div>

                                <div className="mb-6">
                                    <h2 className="font-semibold mb-2">Patient Feedback</h2>
                                    <p>Dr. Imad ud din Yousaf Butt has a 100% patient satisfaction score with 2913 verified patient reviews on oladoc.</p>
                                </div>

                                <div className="mb-6">
                                    <h2 className="font-semibold mb-2">Services Offered</h2>
                                    Following are some of the services offered by Dr. Imad ud din Yousaf Butt:
                                    <ul className="list-disc list-inside pl-6">
                                        <li>ALS / Motor Neuron Disease</li>
                                        <li>ALS Treatment</li>
                                        <li>Alzheimer Disease</li>
                                        <li>Back Pain</li>
                                        <li>Bells Palsy</li>
                                    </ul>
                                </div>

                                <div className="mb-6">
                                    <h2 className="font-semibold mb-2">Conditions Treated</h2>
                                    Following are some of the conditions treated by Dr. Imad ud din Yousaf Butt:
                                    <ul className="list-disc list-inside pl-6">
                                        <li>ALS</li>
                                        <li>Dementia</li>
                                        <li>Dizziness</li>
                                        <li>Epilepsy</li>
                                        <li>Facial Pain</li>
                                    </ul>
                                </div>
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
                                    <svg width="40" height="40" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                        <path d="M11.7946 10.674L11.0279 10.1905V11.0969V12.2093H5.22527V7.79068H11.0279V8.90304V9.80943L11.7946 9.32598L13.7078 8.11963V11.8803L11.7946 10.674ZM3.12612 3.65957L3.12608 3.65961C1.43355 5.3525 0.5 7.60576 0.5 9.99997C0.5 11.5678 0.906841 13.0978 1.68063 14.4496L0.54293 17.8627L0.542666 17.8635C0.443076 18.1639 0.520753 18.4959 0.745674 18.7208C0.905694 18.8808 1.1199 18.9665 1.33866 18.9665C1.42779 18.9665 1.51694 18.9522 1.60241 18.924L1.60379 18.9236L5.0169 17.7859C6.36868 18.5596 7.89872 18.9665 9.46652 18.9665C11.8607 18.9665 14.114 18.0333 15.8069 16.3404C17.4999 14.6474 18.433 12.3941 18.433 9.99997C18.433 7.6058 17.4999 5.35251 15.8069 3.65957C14.114 1.96663 11.8607 1.03345 9.46652 1.03345C7.07236 1.03345 4.81906 1.96663 3.12612 3.65957Z"
                                            fill="#192a56"
                                            stroke="white">
                                        </path>
                                    </svg>
                                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl w-full">
                                        Online Video Consultation
                                    </h3>
                                </div>
                                <span className="box w-[30%] p-2 text-[10px] font-semibold text-[#232426] text-center rounded bg-[#000066]/10">
                                    Pay Online & Get Rs. 400 OFF
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <p className="text-sm">Fee:</p>
                                <p className="text-sm font-semibold">Rs. 1500</p>
                            </div>
                            <hr className="-mt-6" />

                            <div className="flex justify-between">
                                <p className="text-sm">Address:</p>
                                <p className="text-sm font-semibold">Use phone/laptop for video call</p>
                            </div>
                            <hr className="-mt-6" />

                            <div className="flex justify-between">
                                <p className="flex gap-x-2 text-sm text-[#2a872e] font-semibold"><Clock4 className="w-5 h-5" />Available today</p>
                                <p className="text-sm font-semibold">10:00 PM - 11:00 PM </p>
                            </div>

                            <button className="flex gap-x-2 py-4 bg-[#192a56] text-white font-semibold justify-center rounded items-center hover:bg-[#192a56]/90">
                                <svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.7946 10.674L11.0279 10.1905V11.0969V12.2093H5.22527V7.79068H11.0279V8.90304V9.80943L11.7946 9.32598L13.7078 8.11963V11.8803L11.7946 10.674ZM3.12612 3.65957L3.12608 3.65961C1.43355 5.3525 0.5 7.60576 0.5 9.99997C0.5 11.5678 0.906841 13.0978 1.68063 14.4496L0.54293 17.8627L0.542666 17.8635C0.443076 18.1639 0.520753 18.4959 0.745674 18.7208C0.905694 18.8808 1.1199 18.9665 1.33866 18.9665C1.42779 18.9665 1.51694 18.9522 1.60241 18.924L1.60379 18.9236L5.0169 17.7859C6.36868 18.5596 7.89872 18.9665 9.46652 18.9665C11.8607 18.9665 14.114 18.0333 15.8069 16.3404C17.4999 14.6474 18.433 12.3941 18.433 9.99997C18.433 7.6058 17.4999 5.35251 15.8069 3.65957C14.114 1.96663 11.8607 1.03345 9.46652 1.03345C7.07236 1.03345 4.81906 1.96663 3.12612 3.65957Z"
                                        fill="white"
                                        stroke="#192a56">
                                    </path>
                                </svg>
                                Book Video Consultation
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
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
                </div>
            </div>
        </section>
    )
}

export default DoctorDetail