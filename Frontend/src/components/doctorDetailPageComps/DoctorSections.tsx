import { DoctorData } from '@/types';
import InfoSection from './InfoSection';

const DoctorSections = (props: { doctor: DoctorData }) => {
    const { doctor } = props;
    return (
        <>
            {doctor.services && doctor.services.length > 0 && (
                <>
                    <InfoSection title="Services">
                        <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm columns-2"
                            style={{ columnGap: "130px" }}>
                            {doctor.services.map((service, index) => (
                                <li key={index}>{service}</li>
                            ))}
                        </ul>
                    </InfoSection>
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />
                </>
            )}

            {doctor.education && doctor.education.length > 0 && (
                <>
                    <InfoSection title="Education">
                        <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                            {doctor.education.map((edu, index) => (
                                <li key={index}>{edu}</li>
                            ))}
                        </ul>
                    </InfoSection>
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />
                </>
            )}

            {doctor.specializations && doctor.specializations.length > 0 && (
                <>
                    <InfoSection title="Specialization">
                        <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                            {doctor.specializations.map((spec, index) => (
                                <li key={index}>{spec}</li>
                            ))}
                        </ul>
                    </InfoSection>
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />
                </>
            )}

            {doctor.experience && doctor.experience.length > 0 && (
                <>
                    <InfoSection title="Experience">
                        <ul className="space-y-2 text-gray-900 list-disc list-inside mt-2 text-sm">
                            {doctor.experience.map((exp, index) => (
                                <li key={index}>{exp}</li>
                            ))}
                        </ul>
                    </InfoSection>
                    <hr className="hidden relative md:block overflow-hidden md:col-span-3 col-span-5" />
                </>
            )}

            {doctor.bio && (
                <>
                    <InfoSection title="About">
                        <div
                            className="mt-4 my-4 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: doctor.bio }}
                        />
                    </InfoSection>
                </>
            )}

            <InfoSection title="Reviews">
                <p className="mt-4 text-gray-500 text-sm">No reviews available yet.</p>
            </InfoSection>
        </>
    );
};

export default DoctorSections;