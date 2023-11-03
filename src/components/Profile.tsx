"use client";

import React, { useEffect, useState } from "react";

import axios from "axios";

const Profile = () => {
 
  const [username, setname] = useState(null);
  const [useremail, setemail] = useState(null);
  useEffect(() => {
    console.log('profile comp')
    // Check for user authentication here (e.g., verify the user's token).

    // If the user is authenticated, fetch their data from your backend API.
    axios.get("/api/users/profile").then((response) => {
     let ress=response.data;
    
  
     setemail(ress.email)
     setname(ress.username)
    }).catch((error) => {
      // Handle authentication or API request errors here.
      console.error("Error fetching user data:", error);
    });
  }, []);

  return (
    <div>
      <h1>User Profile</h1>
      {username ? (
        <div>
          <p>Name: {username}</p>
          <p>Email: {useremail}</p>
        </div>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
};

export default Profile;