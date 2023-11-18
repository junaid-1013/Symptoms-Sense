'use client';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import Swal from 'sweetalert2';
import { useUser } from '@/helpers/UserContext';
const Navbar = () => {
  const { user, setUser } = useUser();
  const [open, setOpen] = useState(false);

  const onLogout = async () => {

    try {
      const response = axios.get("/api/users/logout");
      setUser(null);
      Swal.fire('Success!', 'Successfully logged out', 'success');
    }
    catch (error: any) {
      console.log("Logging out Failed", error.message);
    } finally {

    }
  }

  useEffect(() => {
    axios.get("/api/users/profile").then((response) => {
      let ress = response.data;

      setUser({ username: 'User' });

    }).catch((error) => {
      setUser(null);
      console.error("Error fetching user data:", error);
    });
  }, []);

  return (
    <header className={`flex items-center w-full bg-[#192a56] md:px-16 px-4`}>
      <div className="container">
        <div className="relative flex items-center justify-between -mx-4">
          <div className="max-w-full px-4 w-60">
            <a href="/#" className="block w-full py-5">
              <Image
                src="/Group.png"
                alt="logo"
                width={1000}
                height={200}
              />
            </a>
          </div>
          <div className="flex items-center justify-between w-full px-4">
            <div>
              <button
                // @click="navbarOpen = !navbarOpen"
                onClick={() => setOpen(!open)}
                // :className="navbarOpen && 'navbarTogglerActive' "
                id="navbarToggler"
                className={` ${open && "navbarTogglerActive"
                  } absolute right-4 top-1/2 block -translate-y-1/2 rounded-lg px-3 py-[6px] ring-white focus:ring-2 lg:hidden`}
              >
                <span className="relative my-[6px] block h-[2px] w-[30px] bg-white"></span>
                <span className="relative my-[6px] block h-[2px] w-[30px] bg-white"></span>
                <span className="relative my-[6px] block h-[2px] w-[30px] bg-white"></span>
              </button>
              <nav
                // :className="!navbarOpen && 'hidden' "
                id="navbarCollapse"
                className={`bg-[#192a56] z-20 absolute right-4 top-full w-full max-w-[250px] rounded-lg py-5 px-6 shadow-lg lg:static lg:block lg:w-full lg:max-w-full lg:shadow-none ${!open && "hidden"
                  } `}
              >
                <ul className="block lg:flex">
                  <ListItem
                    navItemStyles="text-white hover:text-gray-300"
                    NavLink="/"
                  >
                    Home
                  </ListItem>
                  <ListItem
                    navItemStyles="text-white hover:text-gray-300"
                    NavLink="/#service"
                  >
                    Services
                  </ListItem>
                  <ListItem
                    navItemStyles="text-white hover:text-gray-300"
                    NavLink="/#feedback"
                  >
                    Feedback
                  </ListItem>
                  <ListItem
                    navItemStyles="text-white hover:text-gray-300"
                    NavLink="/profile"
                  >
                    Profile
                  </ListItem>
                  <ListItem
                    navItemStyles="text-white hover:text-gray-300"
                    NavLink="/#contact-us"
                  >
                    Contact Us
                  </ListItem>
                  <ListItem
                    navItemStyles="text-white hover:text-gray-300 sm:hidden lg:hidden xl:hidden"
                    NavLink="/login"
                  >
                    Sign In/Up
                  </ListItem>
                </ul>
              </nav>
            </div>
            {user ? (
              <div className="justify-end pr-16 flex lg:pr-0">
                <a
                  onClick={onLogout}
                  href="/"
                  className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80"
                >
                  Logout
                </a>
              </div>
            ) : (
              <div className="justify-end hidden pr-16 sm:flex lg:pr-0">

                <a
                  href="/login"
                  className="py-3 text-base font-medium px-7 text-white hover:text-gray-300"
                >
                  Sign in
                </a>

                <a
                  href="/register"
                  className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80"
                >
                  Sign Up
                </a>
                <a
                  href="/doctorRegistration"
                  className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80"
                >
                  Register
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

const ListItem = ({ children, navItemStyles, NavLink }: any) => {
  return (
    <>
      <li>
        <Link
          href={NavLink}
          className={`flex py-2 text-base font-medium lg:ml-12 lg:inline-flex ${navItemStyles}`}
        >
          {children}
        </Link>
      </li>
    </>
  );
};
