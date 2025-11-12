import { DoctorData } from '@/types';
import Image from "next/image";

const DoctorDetailHeader = (props: { doctor: DoctorData }) => {
    const { doctor } = props;
    return (
        <div className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 
        md:col-span-3 col-span-5 shadow-lg">
            <div className="flex gap-5">
                <div className="block shrink-0">
                    <Image
                        alt={doctor.name}
                        src="/doctor-placeholder2.svg"
                        width={112}
                        height={112}
                        className="h-28 w-28 rounded-full object-cover shadow-lg"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                        {doctor.name}
                    </h3>

                    <p className="mt-1 text-xs font-medium text-gray-600">
                        {doctor.specializations && doctor.specializations.length > 0
                            ? doctor.specializations.join(', ')
                            : 'No specialization'}
                    </p>

                    <div className="mt-4">
                        <p className="max-w-[40ch] text-sm text-gray-500">
                            {doctor.education && doctor.education.length > 0
                                ? doctor.education[0]
                                : 'No education info'}
                        </p>
                    </div>

                    <dl className="mt-6 flex gap-4 sm:gap-6">
                        <div className="flex flex-col-reverse">
                            <dt className="text-sm font-medium text-gray-600">Experience</dt>
                            <dd className="text-xs text-gray-500">{doctor.experience_years} Years</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
};

export default DoctorDetailHeader