'use client'
import React, {useEffect, useRef, useState} from 'react'
import TableOne from "@/components/tables/TableOne"
import TableTwo from "@/components/tables/TableTwo"
import TableThree from "@/components/tables/TableThree"

export default function AdminDashboard() {
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
      // Function to check and update message visibility
      const updateMessageVisibility = () => {
        setShowMessage(window.innerWidth < 950);
      };
  
      // Initial check on component mount
      updateMessageVisibility();
  
      // Add an event listener to update visibility on window resize
      window.addEventListener('resize', updateMessageVisibility);
  
      // Clean up the event listener when the component unmounts
      return () => {
        window.removeEventListener('resize', updateMessageVisibility);
      };
    }, []); 
   

    return (
        <>
            {showMessage ?  <div className="text-center text-red-500 font-bold mb-4">
          Please login from desktop.
        </div> : <div className="flex flex-col gap-10 max-w-screen-xl px-4 py-8 mx-auto sm:px-6 sm:py-12 lg:px-8">
                <TableOne />
                <TableTwo />
                <TableThree />
            </div>}
        </>
    )
}