"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import img from "../../public/user.png";
import Image from "next/image";
import { Clock4, CalendarCheck } from "lucide-react";
import Loading from "@/components/Loading";
import { useUser } from '@/helpers/UserContext';
import Swal from 'sweetalert2';
import { useRouter } from "next/navigation";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
const DoctorProfile = () => {
    const router = useRouter();
    const [appCheck,setApp] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

    const currentDate = new Date();
    const handleDateChange = (date:any) => {
      setSelectedDate(date);
    };
    const handleReservationSubmit = async () => {
        try {
          
            const data = {
                time: selectedDate,
               
            };
          if(!selectedDate){
            throw new Error('Please select the date and time for the reservation');
          }
          const response = await axios.post("/api/reservation", data);
            Swal.fire('Success!', 'Reservation added successfully!', 'success');
  
        } catch (error:any) {
            if (error.response && error.response.data && error.response.data.error) {
                Swal.fire('Failed!', error.response.data.error, 'error');
                router.push('/login')
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'please select time for the appointment',
                    showConfirmButton: false,  // Hide the "OK" button
                    timer: 2000  // Automatically close after 2000 milliseconds (2 seconds)
                  });
            }
            
      }  finally {
  
        } 
      };
    const [appointment,setAppointment] =useState([{ username: 'Dr XYZ', specialty: 'Back Pain', time: '2:30 pm', date: '15 December 2023' },])
    const [prevAppointment,setPrevAppointment] =useState([{ username: 'Dr XYZ', specialty: 'Back Pain', time: '2:30 pm', date: '15 December 2023' }])
    const cancelAppointment = async (data :any) => {
        try {
          const response = await axios.put("/api/cancelAppointment", data);
          router.push("/doctorProfile");
          Swal.fire('Success!', 'Appointment has been cancelled successfully', 'success');
          window.location.reload();
         
      } catch (error: any) {
          
      } finally {
    
      }
    
    
      }
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
                                        <dd className="text-xs text-gray-500">{prevAppointment.length}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
          
                <div >
                {appointment.length ==0? (
         <div className="text-center mt-8">
         <p className="text-gray-500 text-lg">No upcoming appointments</p>
         <span role="img" aria-label="Sad face">
        😞
      </span>
       </div>
      ) : (
                    <div className="inline-flex items-center justify-center w-full px-8 md:px-12 xl:px-32 lg:px-20">
                        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Upcomming Appointments
                        </h2>
                    </div>
      )}
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
                                    <div className="mt-8">
                              <button onClick={() => cancelAppointment(appointment)} className="bg-[#192a56] text-white font-bold py-2 px-4 mx-auto rounded hover:bg-[#192a56]/75">
                                Cancel Appointment
                              </button>
                            </div>
                                    </div>
                                   
                                </div>
                               
                            </div>
                     
                        ))}
                         {prevAppointment.length ==0? (
         <div className="text-center mt-8">
         <p className="text-gray-500 text-lg">No completed appointments</p>
         <span role="img" aria-label="Sad face">
        😞
      </span>
       </div>
      ) : (
                          <div className="inline-flex items-center justify-center w-full px-8 md:px-12 xl:px-32 lg:px-20">
                        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Completed Appointments
                        </h2>
                    </div>
      )}
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
       <div className="flex items-center justify-center min-h-screen ">
      <div className="p-6 text-center items-center bg-white shadow-md rounded-md sm:w-96">
        <h2 className="text-2xl mb-4">Reserve a Schedule</h2>
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={60}
          dateFormat="MMMM d, yyyy h:mm aa"
          placeholderText="Select date and time"
          minDate={currentDate}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500 mb-4"
        />
        <button
          onClick={handleReservationSubmit}
          className="w-full px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:outline-none"
        >
          Reserve
        </button>
      </div>
    </div>
        </div>
    );
};

export default DoctorProfile;