import DoctorCard from "@/components/DoctorCard";

const DoctorData = [
    {
        name: "Dr. Imad ud din Yousaf Butt",
        img: "https://d1t78adged64l7.cloudfront.net/images/profile-pics/doctors/1615822541_f601c147-98f5-4e9a-92e6-44f3a490993f.webp?t=1657800451",
        specialization: "Neurologist",
        education: "MBBS (K.E), F.C.P.S. (Neurology)",
        experience: 9,
        satisfiedPatients: 2913
    },
    {
        name: "Dr. Junaid Ali Bhatti",
        img: "https://media.licdn.com/dms/image/D4D03AQGIXb7VZQ3jxw/profile-displayphoto-shrink_400_400/0/1695925170699?e=1704931200&v=beta&t=uiP6W9OwLAGIoxMeg5k1tzFzaSKstL4VpfX_FDIAg7E",
        specialization: "Neurologist",
        education: "MBBS (K.E), F.C.P.S. (Neurology)",
        experience: 9,
        satisfiedPatients: 2913
    },
    {
        name: "Dr. Imad ud din Yousaf Butt",
        img: "https://d1t78adged64l7.cloudfront.net/images/profile-pics/doctors/1615822541_f601c147-98f5-4e9a-92e6-44f3a490993f.webp?t=1657800451",
        specialization: "Neurologist",
        education: "MBBS (K.E), F.C.P.S. (Neurology)",
        experience: 9,
        satisfiedPatients: 2913
    },
    {
        name: "Dr. Imad ud din Yousaf Butt",
        img: "https://d1t78adged64l7.cloudfront.net/images/profile-pics/doctors/1615822541_f601c147-98f5-4e9a-92e6-44f3a490993f.webp?t=1657800451",
        specialization: "Neurologist",
        education: "MBBS (K.E), F.C.P.S. (Neurology)",
        experience: 9,
        satisfiedPatients: 2913
    },
    {
        name: "Dr. Imad ud din Yousaf Butt",
        img: "https://d1t78adged64l7.cloudfront.net/images/profile-pics/doctors/1615822541_f601c147-98f5-4e9a-92e6-44f3a490993f.webp?t=1657800451",
        specialization: "Neurologist",
        education: "MBBS (K.E), F.C.P.S. (Neurology)",
        experience: 9,
        satisfiedPatients: 2913
    },
    {
        name: "Dr. Imad ud din Yousaf Butt",
        img: "https://d1t78adged64l7.cloudfront.net/images/profile-pics/doctors/1615822541_f601c147-98f5-4e9a-92e6-44f3a490993f.webp?t=1657800451",
        specialization: "Neurologist",
        education: "MBBS (K.E), F.C.P.S. (Neurology)",
        experience: 9,
        satisfiedPatients: 2913
    },
]


const Doctors = () => {
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
                    DoctorData.map((data, index) => (
                        <li key={index}>
                            <DoctorCard
                                name={data.name}
                                img={data.img}
                                specialization={data.specialization}
                                education={data.education}
                                experience={data.experience}
                                satisfiedPatients={data.satisfiedPatients}
                            />
                        </li>
                    ))
                }
            </ul>
        </div>
    )
}

export default Doctors