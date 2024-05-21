export const FORM_VALIDATION = {
    name: {
        required: "Full name is required",
        minLength: { value: 2, message: "Name must be at least 2 characters" },
        maxLength: { value: 50, message: "Name must not exceed 50 characters" },
        pattern: {
            value: /^[a-zA-Z\s]+$/,
            message: "Name should only contain letters and spaces"
        }
    },
    email: {
        required: "Email address is required",
        pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Please enter a valid email address",
        }
    },
    phone: {
        required: "Phone number is required",
        pattern: {
            value: /^03\d{9}$/,
            message: "Please enter a valid phone number (03XXXXXXXXX)",
        }
    },
    subject: {
        required: "Subject is required",
        minLength: { value: 5, message: "Subject must be at least 5 characters" },
        maxLength: { value: 100, message: "Subject must not exceed 100 characters" }
    },
    message: {
        required: "Message is required",
        minLength: { value: 20, message: "Message must be at least 20 characters" },
        maxLength: { value: 500, message: "Message must not exceed 500 characters" }
    }
};