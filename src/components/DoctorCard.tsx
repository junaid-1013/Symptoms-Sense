import Link from "next/link"

interface docSchema {
    name: string,
    img: string,
    specialization: string,
    education: string,
    experience: number,
    satisfiedPatients: number
}


const DoctorCard = ({ name, img, specialization, education, experience, satisfiedPatients }: docSchema) => {
    return (
        <Link href="/doctorDetail"
            className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
            hover:shadow-xl hover:-translate-y-2 cursor-pointer transition-all ease-in-out duration-100"
        >
            <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600" />
            <div className="flex justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                        {name}
                    </h3>

                    <p className="mt-1 text-xs font-medium text-gray-600">{specialization}</p>
                </div>

                <div className="block shrink-0">
                    <img
                        alt={name}
                        src={img}
                        className="h-16 w-16 rounded-lg object-cover shadow-sm"
                    />
                </div>
            </div>

            <div className="mt-4">
                <p className="max-w-[40ch] text-sm text-gray-500">
                    {education}
                </p>
            </div>

            <dl className="mt-6 flex gap-4 sm:gap-6">
                <div className="flex flex-col-reverse">
                    <dt className="text-sm font-medium text-gray-600">Experience</dt>
                    <dd className="text-xs text-gray-500">{experience} Years</dd>
                </div>

                <div className="flex flex-col-reverse">
                    <dt className="text-sm font-medium text-gray-600">Satisfied Patients</dt>
                    <dd className="text-xs text-gray-500">{satisfiedPatients}</dd>
                </div>
            </dl>
        </Link>
    )
}

export default DoctorCard