"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import img from "../../public/user.png";
import Image from "next/image";
import { Clock4, CalendarCheck } from "lucide-react";
import Loading from "@/components/Loading";
import { useUser } from '@/helpers/UserContext';
import Swal from 'sweetalert2';



const DoctorProfile = () => {
    const [appCheck,setApp] = useState('');
    const [appointment,setAppointment] =useState([            { username: 'Dr XYZ', specialty: 'Back Pain', time: '2:30 pm', date: '15 December 2023' },])
    const [prevAppointment,setPrevAppointment] =useState([{ username: 'Dr XYZ', specialty: 'Back Pain', time: '2:30 pm', date: '15 December 2023' }])
    const [appointmentsData,setAppointmentData] =useState( {
        'Upcoming Appointments': [
            { name: 'Dr ABC', specialty: 'Heart Problem', time: '4:00 pm', date: '29 December 2023' },
            { name: 'Dr DEF', specialty: 'Dental Checkup', time: '2:30 pm', date: '31 December 2023' },
            { name: 'Dr GHI', specialty: 'Eye Exam', time: '3:45 pm', date: '5 January 2024' },
            { name: 'Dr JKL', specialty: 'Allergy Consultation', time: '1:15 pm', date: '10 January 2024' },
            { name: 'Dr MNO', specialty: 'Orthopedic Appointment', time: '11:00 am', date: '15 January 2024' },
        ],
        'Previous Appointments': [
            { username: 'Dr XYZ', specialty: 'Back Pain', time: '2:30 pm', date: '15 December 2023' },
           
            
        ],
    });
    const [loading, setLoading] = useState(true);
    const { user, setUser } = useUser();
    const [username, setname] = useState(null);
    const [useremail, setemail] = useState(null);
    const [expYears, setExpYears] = useState(null);
    const [image,setImg]=useState('')
    const [phone,setPhone]=useState('')
    const completeAppointment = async (data :any) => {
        try {
          const response = await axios.put("/api/completedAppointment", data);
          
          window.location.reload();      
          
    
      } catch (error: any) {
        if (error.response && error.response.data && error.response.data.error) {
          Swal.fire('Failed!', error.response.data.error, 'error');
      } else {
          Swal.fire('Failed!', 'An error occurred ', 'error');
      }
      } finally {
    
      }
    
    
      }
      const checkAppointments = () => {
   
        const currentTime = new Date();
    
        appointment.forEach(app => {
          const appointmentTime = new Date(app.time);
          console.log(currentTime)
          if (appointmentTime < currentTime) {
            
            completeAppointment(app)
          }
        });
      };
    useEffect(() => {
        const onEnter = async () => {
        try {
           
            const response = await axios.get("/api/doctorProfile");
            let ress = await response.data;
    
            setUser({ username: 'User' });
            setemail(ress.email)
            setname(ress.name)
          setAppointment(ress.appointments)
          setPrevAppointment(ress.CompletedAppointments)
           setExpYears(ress.experienceYears)
           setImg(ress.image.url)
           setPhone(ress.phone)
            setLoading(false);
            setApp('hello')
        }
   
    catch(error:any)  {
          setUser(null);
          console.error("Error fetching user data:", error);
        }
        finally {

        }
        
      }
      onEnter();
      
    },[]);
    useEffect(() => {
    
        checkAppointments();
      }, [ appCheck]);
    return (
        <div>
        {loading ? (
          <div>
            {/* Display loading component while data is being fetched */}
            <Loading />
          </div>
        ) : (
        <section>
            <div className="max-w-[1170px] px-5 mx-auto grid grid-cols-5 gap-8 py-8">
                <div className="relative block md:col-span-3 md:space-y-0 col-span-5 space-y-4">
                    <div className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
                        md:col-span-3 col-span-5 shadow-lg">
                        <div className="flex gap-5">
                            <div className="block shrink-0">
                                <Image
                                    alt="Dr. Imad ud din Yousaf Butt"
                                    src={image}
                                    width="200"  // Specify the width based on your design requirements
                                    height="200"
                                    className="h-28 w-28 rounded-full object-cover shadow-lg"
                                />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    {username}
                                </h3>

                                <p className="mt-1 text-xs font-medium text-gray-600">{useremail}</p>
                                <div className="mt-4">
                                    <p className="max-w-[40ch] text-sm text-gray-500">
                                        {phone}
                                    </p>
                                </div>

                                <dl className="mt-6 flex gap-4 sm:gap-6">
                                    <div className="flex flex-col-reverse">
                                        <dt className="text-sm font-medium text-gray-600">Experience</dt>
                                        <dd className="text-xs text-gray-500">{expYears} Years</dd>
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

                <div >
                    <div className="inline-flex items-center justify-center w-full px-8 md:px-12 xl:px-32 lg:px-20">
                        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Upcomming Appointments
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-x-4 md:px-16 px-4 justify-center py-8 gap-y-4">
                        {appointment.map((appointment, subIndex) => (
                            <div key={subIndex} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
                                <div className="flex gap-5">
                                    <div className="block shrink-0">
                                        <Image alt={appointment.username} src={img} className="h-12 w-12 rounded-full object-cover shadow-lg" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 sm:text-xl">{appointment.username}</h3>
                                        <p className="mt-1 text-xs font-medium text-gray-600"></p>
                                        <dl className="mt-6 flex">
                                            <div className="flex flex-col items-center">
                                                <dt className="text-sm font-medium text-gray-600 flex items-center gap-x-1">
                                                <CalendarCheck className="w-4 h-4" />
                                                    Date
                                                </dt>
                                                
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <dt className="ml-6 text-sm font-medium text-gray-600 flex items-center ">
                                                    
                                                    <Clock4 className="w-4 h-4" />
                                                    Time
                                                </dt>
                                                <dd className="text-xs text-gray-500"></dd>
                                            </div>
                                        </dl>
                                        <div className="m-4">
                                        </div >
                                        <dd className="text-xs text-gray-500"
                                               // style={{ padding: '80px' }}
                                                >{new Date(appointment.time).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}</dd>
                                    </div>
                                </div>
                            </div>
                        ))}
                          <div className="inline-flex items-center justify-center w-full px-8 md:px-12 xl:px-32 lg:px-20">
                        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Completed Appointments
                        </h2>
                    </div>
                        {prevAppointment.map((appointment, subIndex) => (
                            <div key={subIndex} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 shadow-lg">
                                <div className="flex gap-5">
                                    <div className="block shrink-0">
                                        <Image alt={appointment.username} src={img} className="h-12 w-12 rounded-full object-cover shadow-lg" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 sm:text-xl">{appointment.username}</h3>
                                        <p className="mt-1 text-xs font-medium text-gray-600"></p>
                                        <dl className="mt-6 flex">
                                            <div className="flex flex-col items-center">
                                                <dt className="text-sm font-medium text-gray-600 flex items-center gap-x-1">
                                                <CalendarCheck className="w-4 h-4" />
                                                    Date
                                                </dt>
                                                
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <dt className="ml-6 text-sm font-medium text-gray-600 flex items-center ">
                                                    
                                                    <Clock4 className="w-4 h-4" />
                                                    Time
                                                </dt>
                                                <dd className="text-xs text-gray-500"></dd>
                                            </div>
                                        </dl>
                                        <div className="m-4">
                                        </div >
                                        <dd className="text-xs text-gray-500"
                                               // style={{ padding: '80px' }}
                                                >{new Date(appointment.time).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}</dd>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
           

        </section>
        )}
        </div>
    );
};

export default DoctorProfile;