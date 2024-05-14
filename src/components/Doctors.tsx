'use client'
import DoctorCard from "@/components/DoctorCard";
import Loading from "@/components/Loading";
import { DocSchema } from "@/types";
import axios from "axios";
import { useEffect, useState } from "react";
const Doctors = () => {
    const [loading, setLoading] = useState(true);
    const [DocData, setDocData] = useState<DocSchema[]>([]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get("/api/regDoctor");
                setDocData(response.data.map((doctor:any) => ({
                    ...doctor,
                    id: doctor._id,
                    img: doctor.image?.url,
                    experience: doctor.experienceDetails
                })));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);
    
    return (
        <div>
            {loading ? (
                <div>
                    <Loading />
                </div> // Display loading component while data is being fetched
            ) : (
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
                    <ul className="flex gap-4 mt-8 flex-wrap justify-center">
                        {
                            DocData.map((data, index) => (
                                <li key={index}>
                                    <DoctorCard
                                        {...data}
                                    />
                                </li>
                            ))
                        }
                    </ul>

                </div>
            )}
        </div>
    )
}

export default Doctors