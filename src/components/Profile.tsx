"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapPin } from "lucide-react";
import { useUser } from '@/helpers/UserContext';
const Profile = () => {
  const { user, setUser } = useUser();
  const [username, setname] = useState(null);
  const [useremail, setemail] = useState(null);
  const [appointment, setAppointment] = useState([{time:'',doctor:''}]);
  useEffect(() => {
    

    
    axios.get("/api/users/profile").then((response) => {
      let ress = response.data;

      setUser({ username: 'User' });
      setemail(ress.email)
      setname(ress.username)
      setAppointment(ress.appointments)
      console.log(ress.appointments)
    }).catch((error) => {
      setUser(null);
      console.error("Error fetching user data:", error);
    });
  },[]);

  return (
    <>
      <section className="relative block h-[500px]">
        <div className="absolute top-0 w-full h-full bg-center bg-cover"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1499336315816-097655dcfbda?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=2710&amp;q=80')"
          }}>
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
                    <img alt="..." src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1180&q=80" className="shadow-xl rounded-full h-auto align-middle border-none absolute -m-16 -ml-20 lg:-ml-16 max-w-[150px]" />
                  </div>
                </div>
                <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-center">
                  
                </div>
                <div className="w-full lg:w-4/12 px-4 lg:order-1">
                 
                  <div className="flex justify-center py-4 lg:pt-4 pt-8">
                     {/*
                    <div className="mr-4 p-3 text-center">
                      <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">22</span><span className="text-sm text-blueGray-400">Friends</span>
                    </div>
                    <div className="mr-4 p-3 text-center">
                      <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">10</span><span className="text-sm text-blueGray-400">Photos</span>
                    </div>
                    <div className="lg:mr-4 p-3 text-center">
                      <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">89</span><span className="text-sm text-blueGray-400">Comments</span>
                    </div>
                     */}
                  </div>
                 
                </div>
              </div>
              {username ? (
                <div className="text-center mt-12">
                  <h3 className="text-xl font-semibold text-red-600 leading-normal mb-2">
                  <br />
                    Name : {username}
                    <br />
                    Email: {useremail}
                    <br />  <br />
                    <h3 className="text-lg font-bold text-blue-900 sm:text-xl">
                                              Upcomming Appointments
                                              <br />  <br />
                                          </h3>
                    {


                                appointment.map((data, index) => (

                                  <div 
                                  key={index}
                                  className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
                                  hover:shadow-xl  transition-all ease-in-out duration-100"
                              >
                                  <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600" />
                                  <div className="flex justify-between gap-4">
                                      <div>
                                          <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                                              {data.doctor}
                                          </h3>
                      
                                          
                                      </div>
                      
                                      <div className="block shrink-0">
                                          <img
                                            alt="..." 
                                            src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1180&q=80" 
                                              className="h-16 w-16 rounded-lg object-cover shadow-sm"
                                          />
                                      </div>
                                  </div>
                      
                                  <div className="mt-4">
                                      <p className="max-w-[35ch] font-bold text-sm text-gray-500">
                                          Date/Time:   {new Date(data.time).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}
                                      </p>
                                  </div>
                      
                                  
                              </div>
                                    
                                    ))
                    
                                }
                  </h3>
                  <div className="text-sm leading-normal mt-0 mb-2 text-gray-500 font-bold flex items-center justify-center">
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
                    you empower us to provide you with personalized health recommendations and predictions tailored to your unique needs. Join our community, take control of your well-being, and experience a healthier future like never before.
                    </p>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Profile;