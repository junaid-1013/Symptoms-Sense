
'use client'
import axios from "axios";
import React, { useState, useEffect } from "react";
import DoctorCard from "@/components/DoctorCard";
import Link from "next/link";
const Doctors = () => {
    const [DocData, setData] = useState([{
        "id": 1,
        "name": "Dr. Sara Rasul",
        "image": { 'url': "https://d1t78adged64l7.cloudfront.net/images/profile-pics/doctors/1693395725_IMG-20230822-WA0009.webp?t=1693395726" }
        , "services": [
            "Amenorrhoea",
            "Antenatal Care",
            " Antenatal Checkup",
            " Caesarean (C-Section)"
        ],
        "education": [
            "MBBS - The University of Lahore 2012",
            "FCPS (Gynecology and Obstetrics) - College of Physicians and Surgeons, 2020"
        ],
        "specialization": [
            "Gynecologist",
            "Obstetrician"
        ],
        "experienceDetails": [

            "Dr. Sara Rasul has over 10 years of experience in her field."
        ],
        "about": "Dr. Sara Rasul is a top Gynecologist with 10 years of experience. You can book an appointment with Dr. Sara Rasul through Symptoms Sense",
        "category": "Gynecologist",
        "experienceYears": 1
    }]);
    useEffect(() => {
        const fetchData = async () => {
            try {

                const response = await axios.get("/api/regDoctor");
                console.log(response.data)
                setData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);
    return (
        <div className="max-w-screen-xl px-4 py-8 mx-auto sm:px-6 sm:py-12 lg:px-8">
            <div className="flex flex-wrap justify-center text-center mt-12">
                <div className="inline-flex items-center justify-center w-full px-8 md:px-12 xl:px-32 lg:px-20">
                    <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Doctors
                    </h2>
                </div>
                <div className="w-full lg:w-6/12 px-4 pt-8">
                    <p className="text-gray-700 text-lg font-light">
                        &quot;Transforming Healthcare: Our Comprehensive Services&quot;
                    </p>
                </div>
            </div>
            <ul className="grid gap-4 mt-8 sm:grid-cols-2 lg:grid-cols-3">
                {
                    DocData.map((data, index) => (
                        <li key={index}>
                            <DoctorCard
                                name={data.name}
                                img={data.image.url}
                                specialization={data.specialization}
                                education={data.education}
                                experience={data.experienceDetails}
                                services={data.services}
                                about={data.about}
                                experienceYears={data.experienceYears}
                            //   satisfiedPatients={data.satisfiedPatients}
                            />
                        </li>
                    ))
                }
            </ul>
            <div className="flex mt-4 justify-center">
                <Link
                    href="/doctorRegistration"
                    className="py-3 text-base font-medium text-white rounded-lg bg-[#273c75] px-7 hover:bg-opacity-80"
                >
                    Register as a Doctor
                </Link>
            </div>
        </div>
    )
}

export default Doctors