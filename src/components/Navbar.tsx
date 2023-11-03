'use client';
import React, { useState } from "react";
import Image from "next/image";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className={`flex items-center w-full bg-green-600 md:px-16 px-4`}>
      <div className="container">
        <div className="relative flex items-center justify-between -mx-4">
          <div className="max-w-full px-4 w-60">
            <a href="/#" className="block w-full py-5">
              <Image
                src="/Group.png"
                alt="logo"
                width={1000}
                height={1000}
                // className="w-14 "
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
                className={` ${
                  open && "navbarTogglerActive"
                } absolute right-4 top-1/2 block -translate-y-1/2 rounded-lg px-3 py-[6px] ring-white focus:ring-2 lg:hidden`}
              >
                <span className="relative my-[6px] block h-[2px] w-[30px] bg-white"></span>
                <span className="relative my-[6px] block h-[2px] w-[30px] bg-white"></span>
                <span className="relative my-[6px] block h-[2px] w-[30px] bg-white"></span>
              </button>
              <nav
                // :className="!navbarOpen && 'hidden' "
                id="navbarCollapse"
                className={`bg-green-600 z-20 absolute right-4 top-full w-full max-w-[250px] rounded-lg py-5 px-6 shadow-lg lg:static lg:block lg:w-full lg:max-w-full lg:shadow-none ${
                  !open && "hidden"
                } `}
              >
                <ul className="block lg:flex">
                  <ListItem
                    navItemStyles="text-white hover:text-[#00A3FF]"
                    NavLink="/#"
                  >
                    Home
                  </ListItem>
                  <ListItem
                    navItemStyles="text-white hover:text-[#00A3FF]"
                    NavLink="/#"
                  >
                    Explore
                  </ListItem>
                  <ListItem
                  
                    navItemStyles="text-white hover:text-[#00A3FF]"
                 
                    NavLink="/profile"
                    
                  >
                    Profile
                  </ListItem>
                  <ListItem
                    navItemStyles="text-white hover:text-[#00A3FF]"
                    NavLink="/#"
                  >
                    About
                  </ListItem>
                </ul>
              </nav>
            </div>
            <div className="justify-end hidden pr-16 sm:flex lg:pr-0">
              <a
                href="/login"
                className="py-3 text-base font-medium px-7 text-white hover:text-[#00A3FF]"
              >
                Sign in
              </a>

              <a
                href="/register"
                className="py-3 text-base font-medium text-white rounded-lg bg-[#00A3FF] px-7 hover:bg-opacity-80"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

const ListItem = ({ children, navItemStyles, NavLink }:any) => {
  return (
    <>
      <li>
        <a
          href={NavLink}
          className={`flex py-2 text-base font-medium lg:ml-12 lg:inline-flex ${navItemStyles}`}
        >
          {children}
        </a>
      </li>
    </>
  );
};
