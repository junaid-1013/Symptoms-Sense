import { Stethoscope, Workflow, Bot } from "lucide-react"

const Services = () => {
    return (
        <div id="service">
            <div id="services" className="flex flex-wrap justify-center text-center mt-12">
                <div className="inline-flex items-center justify-center w-full px-8 md:px-12 xl:px-32 lg:px-20">
                    <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Our Services
                    </h2>
                </div>
                <div className="w-full lg:w-6/12 px-4 pt-8">
                    <p className="text-gray-700 text-lg font-light">
                    &quot;Transforming Healthcare: Our Comprehensive Services&quot;
                    </p>
                </div>
            </div>
            <div className="xl:px-28 flex flex-wrap p-8 justify-center pb-0">

                <div className="w-full px-4 md:w-1/2 lg:w-1/3">
                    <div className="mb-9 rounded-xl py-8 px-7 shadow-md transition-all hover:shadow-lg sm:p-9 lg:px-6 xl:px-9">
                        <div className="mx-auto mb-7 inline-block">
                            <Stethoscope strokeWidth="1.2px" className="w-16 h-16 text-[#273c75]" />
                        </div>
                        <div>
                            <h3 className="mb-4 text-xl font-bold text-black sm:text-2xl lg:text-xl xl:text-2xl">
                                Disease Diagnosis and Recomendation
                            </h3>
                            <p className="text-base font-medium text-body-color">
                            Experience precise disease diagnosis and personalized recommendations, empowering you to take control of your well-being with expert guidance.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full px-4 md:w-1/2 lg:w-1/3">
                    <div className="mb-9 rounded-xl py-8 px-7 shadow-md transition-all hover:shadow-lg sm:p-9 lg:px-6 xl:px-9">
                        <div className="mx-auto mb-7 inline-block">
                            <Bot strokeWidth="1.2px" className="w-16 h-16 text-[#273c75]" />
                        </div>
                        <div>
                            <h3 className="mb-4 text-xl font-bold text-black sm:text-2xl lg:text-xl xl:text-2xl">
                            Customized AI Medical Chatbot Development
                            </h3>
                            <p className="text-base font-medium text-body-color">
                            Unlock the future of healthcare with our custom AI Medical Chatbot Development, designed to cater to your unique healthcare needs and deliver exceptional patient care.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full px-4 md:w-1/2 lg:w-1/3">
                    <div className="mb-9 rounded-xl py-8 px-7 shadow-md transition-all hover:shadow-lg sm:p-9 lg:px-6 xl:px-9">
                        <div className="mx-auto mb-7 inline-block">
                            <Workflow strokeWidth="1.2px" className="w-16 h-16 text-[#273c75]" />
                        </div>
                        <div>
                            <h3 className="mb-4 text-xl font-bold text-black sm:text-2xl lg:text-xl xl:text-2xl">
                            Seamless Chatbot Integration
                            </h3>
                            <p className="text-base font-medium text-body-color">
                            Streamline customer interactions with seamless chatbot integration, enhancing communication and support while saving time and resources for your business.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Services