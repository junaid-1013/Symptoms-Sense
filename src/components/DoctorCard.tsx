import { DocSchema } from "@/types";
import Link from "next/link";
import queryString from 'query-string';
import { useEffect, useState } from "react";

const DoctorCard = (props: DocSchema) => {
    const { id, name, img, specialization, education, experience, services, about, experienceYears, city, streetAddress, reservations, feedbacks } = props;
    const [reserveTime, setReserve] = useState(['k']);
    const [feedback, setFeedback] = useState([''])
    const [user, setUser] = useState([''])

    useEffect(() => {

        const timeArray = reservations.map(obj => obj.time);
        setReserve(timeArray)
        const feedbackArray = feedbacks.map(obj => obj.review);
        const userArray = feedbacks.map(obj => obj.username);
        setFeedback(feedbackArray)
        setUser(userArray)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const details = {
        id: id, name: name, img: img, specialization: specialization, education: education, experience: experience,
        services: services, about: about, experienceYears: experienceYears, city, streetAddress, reserveTime, feedback, user
    };
    const query = queryString.stringify(details, { arrayFormat: 'separator', arrayFormatSeparator: '*' });
    return (
        <Link href={{ pathname: '/doctorDetail', query: query }}

            className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
            hover:shadow-xl hover:-translate-y-2 cursor-pointer transition-all ease-in-out duration-100
            w-80 sm:w-96 h-60
            "
        >
            <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600" />
            <div className="flex justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                        {name}
                    </h3>

                    <p className="mt-1 text-xs font-medium text-gray-600">{specialization[0]}</p>
                </div>

                <div className="block shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        alt={name}
                        src={img}
                        className="h-16 w-16 rounded-lg object-cover shadow-sm"
                    />
                </div>
            </div>

            <div className="mt-4">
                <p className="max-w-[40ch] text-sm text-gray-500">
                    {education[0]}
                </p>
            </div>

            <dl className="mt-6 flex gap-4 sm:gap-6">
                <div className="flex flex-col-reverse">
                    <dt className="text-sm font-medium text-gray-600">Experience</dt>
                    <dd className="text-xs text-gray-500">{experienceYears} Years</dd>
                </div>
            </dl>
        </Link>
    )
}

export default DoctorCard