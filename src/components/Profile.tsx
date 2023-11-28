"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import RatingForm from "@/components/RatingForm";
import Swal from 'sweetalert2';
import Loading from "@/components/Loading";
import { useUser } from '@/helpers/UserContext';
const Profile = () => {

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useUser();
  const [username, setname] = useState(null);
  const [useremail, setemail] = useState(null);
  const [appointment, setAppointment] = useState([{time:'',doctor:''}]);
  const [compAppointment, setCompAppointment] = useState([{time:'',doctor:''}]);
  const [reminder, setReminder] = useState([{medicineName: '',dosage: 1,selectedDays: [ ],reminderTime: '',medicineType: ''}]);
  const [image,setImage]=useState("")
  const cancelAppointment = async (data :any) => {
    try {
      const response = await axios.post("/api/cancelAppointment", data);
      router.push("/profile");
      Swal.fire('Success!', 'Appointment has been cancelled successfully', 'success');
      window.location.reload();
      console.log("Login Success", response.data);
    
      
      

  } catch (error: any) {
      
  } finally {

  }


  }
  const cancelReminder = async (data :any) => {
    try {
      const response = await axios.put("/api/medicineReminder", data);
      router.push("/profile");
      Swal.fire('Success!', 'Reminder has been cancelled successfully', 'success');
      window.location.reload();      
      

  } catch (error: any) {
      
  } finally {

  }


  }
  const completeAppointment = async (data :any) => {
    try {
      const response = await axios.post("/api/completedAppointment", data);
      
      window.location.reload();      
      

  } catch (error: any) {
      
  } finally {

  }


  }
  const checkAppointments = () => {
   
    const currentTime = new Date();

    appointment.forEach(app => {
      const appointmentTime = new Date(app.time);
      console.log(currentTime)
      if (appointmentTime < currentTime) {
        console.log('hello1')
        completeAppointment(app)
      }
    });
  };
  useEffect(() => {
    
   
    axios.get("/api/users/profile").then((response) => {
      let ress = response.data;

      setUser({ username: 'User' });
      setemail(ress.email)
      setname(ress.username)
      setAppointment(ress.appointments)
      setReminder(ress.reminders)
      setCompAppointment(ress.CompletedAppointments)
        setImage(ress.image.url)
      setLoading(false);

    }).catch((error) => {
      setUser(null);
      console.error("Error fetching user data:", error);
    });
    
  },[]);
  useEffect(() => {
    
    checkAppointments();
  }, [appointment]);
  return (
    <div>
      {loading ? (
        <div>
          {/* Display loading component while data is being fetched */}
          <Loading />
        </div>
      ) : (
        <div>
          <section className="relative block h-[500px]">
            <div className="absolute top-0 w-full h-full bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1499336315816-097655dcfbda?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=2710&amp;q=80')" }}>
              <span id="blackOverlay" className="w-full h-full absolute opacity-50 bg-black"></span>
            </div>
            <div className="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden h-70-px" style={{ transform: "translateZ(0px)" }}>
              <svg className="absolute bottom-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0">
                <polygon className="text-blueGray-200 fill-current" points="2560 0 2560 100 0 100"></polygon>
              </svg>
            </div>
          </section>
          <section className="relative py-16 bg-blueGray-200">
            <div className="container mx-auto px-4">
              <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-lg -mt-64">
                <div className="px-6">
                  <div className="flex flex-wrap justify-center">
                    <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
                      <div className="relative">
                        <img alt="..." src={image} className="shadow-xl rounded-full h-auto align-middle border-none absolute -m-16 -ml-20 lg:-ml-16 max-w-[150px]" />
                      </div>
                    </div>
                    <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-center">
                      {/* Additional content for the right column if needed */}
                    </div>
                    <div className="w-full lg:w-4/12 px-4 lg:order-1">
                      <div className="flex justify-center py-4 lg:pt-4 pt-8">
                        {/* Additional content for the center column if needed */}
                      </div>
                    </div>
                  </div>
                  {username ? (
                    <div className="text-center mt-12">
                      <br>
                      </br>
                     <h3 className="text-2xl  leading-normal mb-4">

  <span className="block font-bold text-red-600">Name</span>
  {username}
</h3>
<h3 className="text-2xl  text-black-600 leading-normal mb-4">
  <span className="block font-bold text-red-600">Email</span>
  {useremail}
</h3>
{appointment.length ==0? (
         <div className="text-center mt-8">
         <p className="text-gray-500 text-lg">No upcoming appointments</p>
         <span role="img" aria-label="Sad face">
        😞
      </span>
       </div>
      ) : (
        <div>
                      <h3 className="text-lg font-bold text-blue-900 sm:text-xl mt-4">
                        Upcoming Appointments
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                        {appointment.map((data, index) => (
                          <div key={index} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all ease-in-out duration-100">
                            <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600" />
                            <div className="flex justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{data.doctor}</h3>
                              </div>
                              <div className="block shrink-0">
                                <img alt="..." src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1180&q=80" className="h-16 w-16 rounded-lg object-cover shadow-sm" />
                              </div>
                            </div>
                            <div className="mt-4">
                              <p className="max-w-[35ch] font-bold text-sm text-gray-500">
                                Date/Time: {new Date(data.time).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}
                              </p>
                            </div>
                            <div className="mt-8">
                              <button onClick={() => cancelAppointment(data)} className="bg-[#192a56] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#192a56]/75">
                                Cancel Appointment
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
      )}
      {reminder.length ==0? (
         <div className="text-center mt-8">
          <p className="text-gray-500 text-lg">
      No upcoming reminders to show
      <span role="img" aria-label="Sad face">
        😞
      </span>
    </p>
       </div>
      ) : (
        <div>
                      <h3 className="text-lg font-bold text-blue-900 sm:text-xl mt-8">
                        Medicine Reminders
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                        {reminder.map((data, index) => (
                          <div key={index} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all ease-in-out duration-100">
                            <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600" />
                            <div className="flex justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Medicine Name : {"   " + data.medicineName}</h3>
                                <p className="text-md font-bold text-red-600">MedicineType : {"   " + data.medicineType}</p>
                              </div>
                              <div className="block shrink-0">
                                <img alt="..." src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1180&q=80" className="h-16 w-16 rounded-lg object-cover shadow-sm" />
                              </div>
                            </div>
                            <div className="mt-4">
                              <p className="max-w-[35ch] font-bold text-md text-blue-500">Reminder Time : {data.reminderTime}<br /></p>
                              <p className="max-w-[35ch]">Days : {data.selectedDays.join(", ")}</p>
                            </div>
                            <div className="mt-8">
                              <button onClick={() => cancelReminder(data)} className="bg-[#192a56] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#192a56]/75">
                                Cancel Reminder
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
      )}
      <div className="mt-8">
  <Link href="/medicineReminder">
    <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
      Add Reminder
    </button>
  </Link>
</div>
{compAppointment.length ==0? (
         <div className="text-center mt-8">
         <p className="text-gray-500 text-lg">No Completed appointments</p>
         <span role="img" aria-label="Sad face">
        😞
      </span>
       </div>
      ) : (
        <div>
                      <h3 className="text-lg font-bold text-blue-900 sm:text-xl mt-4">
                        Completed Appointments
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                        {compAppointment.map((data, index) => (
                          <div key={index} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all ease-in-out duration-100">
                            <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600" />
                            <div className="flex justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{data.doctor}</h3>
                              </div>
                              <div className="block shrink-0">
                                <img alt="..." src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1180&q=80" className="h-16 w-16 rounded-lg object-cover shadow-sm" />
                              </div>
                            </div>
                            <div className="mt-4">
                              <p className="max-w-[35ch] font-bold text-sm text-gray-500">
                                Date/Time: {new Date(data.time).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}
                              </p>
                            </div>
                            <div className="mt-8">
                            <RatingForm doctorData={data}/>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
      )}

                      <div className="text-sm leading-normal mt-8 text-gray-500 font-bold flex items-center justify-center">
                        <MapPin className="text-gray-500" />
                        Lahore, Pakistan
                      </div>
                    </div>
                  ) : (
                    <h1>Please Sign in to view User Profile.........</h1>
                  )}
                  <div className="mt-10 py-10 border-t border-blueGray-200 text-center">
                    <div className="flex flex-wrap justify-center">
                      <div className="w-full lg:w-9/12 px-4">
                        <p className="mb-4 text-lg leading-relaxed text-blueGray-700">
                          You empower us to provide you with personalized health recommendations and predictions tailored to your unique needs. Join our community, take control of your well-being, and experience a healthier future like never before.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;