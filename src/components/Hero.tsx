const Hero = () => {
    return (
        <>
            <div className="relative bg-white pt-12 sm:px-16 px-8">
                <div className="container">
                    <div className="flex flex-wrap -mx-4">
                        <div className="w-full px-4 lg:w-5/12">
                            <div className="hero-content">
                                <h1 className="mb-3 text-4xl font-bold leading-snug text-dark sm:text-[42px] lg:text-[40px] xl:text-[42px]">
                                Your Health, Your Future: Predicting Wellness
                                </h1>
                                <p className="mb-8 max-w-[480px] text-base text-body-color">
                                Welcome to our cutting-edge Disease Prediction System, a revolutionary
                                 platform dedicated to enhancing healthcare decision-making.
                                  Our system combines the power of artificial intelligence with 
                                  comprehensive medical knowledge to provide personalized predictions and recommendations
                                   for a healthier future. With our user-friendly interface, 
                                   you can access data-driven insights to stay ahead of potential health risks
                                    and make informed choices.
                                </p>
                                 {/*
                                <ul className="flex flex-wrap items-center">
                                    <li>
                                        <a
                                            href="/#"
                                            className="inline-flex items-center justify-center px-6 py-4 text-base font-normal text-center text-white rounded-lg bg-primary hover:bg-opacity-90 sm:px-10 lg:px-8 xl:px-10"
                                        >
                                            Get Started
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="/#"
                                            className="inline-flex items-center justify-center px-6 py-4 text-base font-normal text-center text-body-color hover:text-primary sm:px-10 lg:px-8 xl:px-10"
                                        >
                                            <span className="mr-2">
                                                <svg
                                                    width="22"
                                                    height="22"
                                                    viewBox="0 0 22 22"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <circle cx="11" cy="11" r="11" fill="#3056D3" />
                                                    <rect
                                                        x="6.90906"
                                                        y="13.3636"
                                                        width="8.18182"
                                                        height="1.63636"
                                                        fill="white"
                                                    />
                                                    <rect
                                                        x="10.1818"
                                                        y="6"
                                                        width="1.63636"
                                                        height="4.09091"
                                                        fill="white"
                                                    />
                                                    <path
                                                        d="M11 12.5454L13.8343 9.47726H8.16576L11 12.5454Z"
                                                        fill="white"
                                                    />
                                                </svg>
                                            </span>
                                            Download App
                                        </a>
                                    </li>
                                </ul>
    */}
                                <div className="pt-16 clients">
                                    <h6 className="flex items-center mb-3 text-xs font-normal text-body-color">
                                        Some Of Our Clients
                                        <span className="ml-2 inline-block h-[1px] w-8 bg-body-color"></span>
                                    </h6>

                                    <div className="flex items-center space-x-4">
                                        <SingleImage
                                            href="#"
                                            imgSrc="https://cdn.tailgrids.com/2.0/image/assets/images/brands/ayroui.svg"
                                        />

                                        <SingleImage
                                            href="#"
                                            imgSrc="https://cdn.tailgrids.com/2.0/image/assets/images/brands/graygrids.svg"
                                        />

                                        <SingleImage
                                            href="#"
                                            imgSrc="https://cdn.tailgrids.com/2.0/image/assets/images/brands/uideck.svg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hidden px-4 lg:block lg:w-1/12"></div>
                        <div className="w-full px-4 lg:w-6/12">
                            <div className="lg:ml-auto lg:text-right">
                                <div className="relative z-10 inline-block pt-11 lg:pt-0">
                                    <img
                                        src="https://cdn.tailgrids.com/1.0/assets/images/hero/hero-image-01.png"
                                        alt="hero"
                                        className="max-w-full lg:ml-auto"
                                    />
                                    <span className="absolute -left-8 -bottom-8 z-[-1]">
                                        <svg
                                            width="93"
                                            height="93"
                                            viewBox="0 0 93 93"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <circle cx="2.5" cy="2.5" r="2.5" fill="#3056D3" />
                                            <circle cx="2.5" cy="24.5" r="2.5" fill="#3056D3" />
                                            <circle cx="2.5" cy="46.5" r="2.5" fill="#3056D3" />
                                            <circle cx="2.5" cy="68.5" r="2.5" fill="#3056D3" />
                                            <circle cx="2.5" cy="90.5" r="2.5" fill="#3056D3" />
                                            <circle cx="24.5" cy="2.5" r="2.5" fill="#3056D3" />
                                            <circle cx="24.5" cy="24.5" r="2.5" fill="#3056D3" />
                                            <circle cx="24.5" cy="46.5" r="2.5" fill="#3056D3" />
                                            <circle cx="24.5" cy="68.5" r="2.5" fill="#3056D3" />
                                            <circle cx="24.5" cy="90.5" r="2.5" fill="#3056D3" />
                                            <circle cx="46.5" cy="2.5" r="2.5" fill="#3056D3" />
                                            <circle cx="46.5" cy="24.5" r="2.5" fill="#3056D3" />
                                            <circle cx="46.5" cy="46.5" r="2.5" fill="#3056D3" />
                                            <circle cx="46.5" cy="68.5" r="2.5" fill="#3056D3" />
                                            <circle cx="46.5" cy="90.5" r="2.5" fill="#3056D3" />
                                            <circle cx="68.5" cy="2.5" r="2.5" fill="#3056D3" />
                                            <circle cx="68.5" cy="24.5" r="2.5" fill="#3056D3" />
                                            <circle cx="68.5" cy="46.5" r="2.5" fill="#3056D3" />
                                            <circle cx="68.5" cy="68.5" r="2.5" fill="#3056D3" />
                                            <circle cx="68.5" cy="90.5" r="2.5" fill="#3056D3" />
                                            <circle cx="90.5" cy="2.5" r="2.5" fill="#3056D3" />
                                            <circle cx="90.5" cy="24.5" r="2.5" fill="#3056D3" />
                                            <circle cx="90.5" cy="46.5" r="2.5" fill="#3056D3" />
                                            <circle cx="90.5" cy="68.5" r="2.5" fill="#3056D3" />
                                            <circle cx="90.5" cy="90.5" r="2.5" fill="#3056D3" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Hero;

const SingleImage = ({ href, imgSrc }:any) => {
    return (
        <>
            <a href={href} className="flex w-full items-center justify-center">
                <img src={imgSrc} alt="brand image" className="w-full h-10" />
            </a>
        </>
    );
};




