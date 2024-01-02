"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RatingForm from "@/components/RatingForm";
import Swal from 'sweetalert2';
import Loading from "@/components/Loading";
import { useUser } from '@/helpers/UserContext';
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileEdit } from "lucide-react";

const Profile = () => {

  const router = useRouter();
  const [appCheck, setApp] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useUser();
  const [username, setname] = useState(null);
  const [useremail, setemail] = useState(null);
  const [appointment, setAppointment] = useState([{ time: '', doctor: '', doctor_id: '' }]);
  const [compAppointment, setCompAppointment] = useState([{ time: '', doctor: '' }]);
  const [reminder, setReminder] = useState([{ medicineName: '', dosage: 1, selectedDays: [], reminderTime: '', medicineType: '' }]);
  const [image, setImage] = useState('/user.png');
  const cancelAppointment = async (data: any) => {
    try {
      const response = await axios.post("/api/cancelAppointment", data);
      router.push("/profile");
      Swal.fire('Success!', 'Appointment has been cancelled successfully', 'success');
      window.location.reload();

    } catch (error: any) {

    } finally {

    }


  }
  const cancelReminder = async (data: any) => {
    try {
      const response = await axios.put("/api/medicineReminder", data);
      router.push("/profile");
      Swal.fire('Success!', 'Reminder has been cancelled successfully', 'success');
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
  const completeAppointment = async (data: any) => {
    try {
      const response = await axios.post("/api/completedAppointment", data);

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


    axios.get("/api/users/profile").then((response) => {
      let ress = response.data;

      setUser({ username: 'User' });
      setemail(ress.email)
      setname(ress.username)
      setAppointment(ress.appointments)
      setReminder(ress.reminders)
      setCompAppointment(ress.CompletedAppointments)
      //setImage(ress.image.url)
      setLoading(false);
      setApp('hello')
    }).catch((error) => {
      setUser(null);
      console.error("Error fetching user data:", error);
    });

  }, []);
  useEffect(() => {
    console.log(appointment)
    checkAppointments();
  }, [appCheck]);
  return (
    <div>
      {loading ? (
        <div>
          {/* Display loading component while data is being fetched */}
          <Loading />
        </div>
      ) : (
        <div>
          <section className="relative block h-[250px]">
            <div className="absolute top-0 w-full h-full bg-center bg-cover -z-10"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1499336315816-097655dcfbda?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=2710&amp;q=80')" }}
            >
              <span id="blackOverlay" className="w-full h-full absolute opacity-50 bg-black"></span>
            </div>
          </section>
          <div className="container flex flex-col items-center gap-y-4 -mt-20 ">
            <img alt="..." src={image} className="shadow-xl rounded-full h-auto align-middle border-4 border-white max-w-[150px]" />
            <Link
              href='/editProfile'
              className="-mt-12 ml-24 py-3 text-base font-medium text-[#273c75] rounded-full bg-white px-3 hover:bg-gray-200">
              <FileEdit />
            </Link>
            <div className="text-center flex flex-col">
              <Label className="text-3xl font-bold">
                {username}
              </Label>
              <Label className="text-lg text-gray-500">
                {useremail}
              </Label>
            </div>
          </div>
          <Tabs defaultValue="upcommingAppointments" className="w-full md:px-20 px-8 mt-4 min-h-[500px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcommingAppointments">Upcomming Appointments</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="completedAppointments">Completed Appointments</TabsTrigger>
            </TabsList>
            <TabsContent value="upcommingAppointments">
              <div className="mt-4">
                {appointment.length == 0 ? (
                  <div className="text-center justify-center py-16">
                    <Label className="text-lg">😞 No upcoming appointments</Label>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                      {appointment.map((data, index) => (
                        <div key={index} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all ease-in-out duration-100">
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
              </div>
            </TabsContent>
            <TabsContent value="reminders">
              {reminder.length == 0 ? (
                <div className="text-center justify-center py-16">
                  <Label className="text-lg">😞  No upcoming reminders to show</Label>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                    {reminder.map((data, index) => (
                      <div key={index} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all ease-in-out duration-100">
                        <div className="flex justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 sm:text-xl capitalize">{"   " + data.medicineName}</h3>
                            <p className="text-md font-bold text-red-600 capitalize">{"   " + data.medicineType}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="max-w-[35ch] font-bold text-md text-blue-500">Time : {data.reminderTime}<br /></p>
                          <p className="max-w-[35ch]">Days : {data.selectedDays.join(", ")}</p>
                        </div>
                        <div className="mt-8">
                          <button
                            onClick={() => cancelReminder(data)}
                            className="bg-[#192a56] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#192a56]/75">
                            Cancel Reminder
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="justify-center flex">
                <Link href="/medicineReminder">
                  <button className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80">
                    Add Reminder
                  </button>
                </Link>
              </div>
            </TabsContent>
            <TabsContent value="completedAppointments">
              {compAppointment.length == 0 ? (
                <div className="text-center justify-center py-16">
                  <Label className="text-lg">😞  No Completed appointments</Label>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 my-4">
                    {compAppointment.map((data, index) => (
                      <div key={index} className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all ease-in-out duration-100">
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
                          <RatingForm doctorData={data} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Profile;