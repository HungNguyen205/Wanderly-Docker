import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import logo from '@/assets/images/logo.png';

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.fullName?.trim())
            return toast.warn("Please enter your full name!");
        if (!formData.email?.trim())
            return toast.warn("Please enter your email!");
        if (!formData.password?.trim())
            return toast.warn("Please enter your password!");
        if (formData.password !== formData.confirmPassword)
            return toast.warn("Passwords do not match!");

        const { confirmPassword, ...dataToSend } = formData;

        setLoading(true);
        try {
            // Payload format: camelCase { fullName, email, password }
            console.log('Sending registration data:', dataToSend);

            const res = await axios.post("/api/auths/register", dataToSend);

            toast.success(res.data.message || "Registration successful!");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            const errMsg = err.response?.data?.message || "System error!";
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gradient-bg h-dvh flex items-center justify-center overflow-hidden px-4">
            <div className="glass-card w-full max-w-md h-[92dvh] flex flex-col justify-between p-6 md:p-8 animate-fadeIn">
                {/* Header */}
                <div className="text-center mt-1">
                    <div className="flex justify-center mb-3 relative">
                        <div className="w-32 h-32">
                            <img
                                src={logo}
                                alt="Logo Wanderly"
                                className="w-full h-full object-cover rounded-full"
                            />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold bg-linear-to-r from-[var(--color-primary)] to-[var(--color-mint)] bg-clip-text text-transparent mb-1">
                        Create Account
                    </h1>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-4 flex-1 flex flex-col justify-center"
                >
                    {[
                        { label: "Full Name", name: "fullName", type: "text", placeholder: "Enter full name" },
                        { label: "Email Address", name: "email", type: "email", placeholder: "Enter email" },
                        { label: "Password", name: "password", type: "password", placeholder: "Enter password" },
                        { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "Enter confirm password" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-gray-700 font-medium mb-1 text-sm">
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                name={field.name}
                                value={formData[field.name]}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                required
                                className="input-field bg-white/80 hover:bg-white focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm py-2 transition-all duration-300"
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary text-white text-sm md:text-base py-2 shadow-md hover:shadow-[0_6px_15px_rgba(255,107,107,0.25)] cursor-pointer transition-all duration-300 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : "Create Account"}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-gray-600 mb-3 text-sm">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-mint)] transition-colors duration-300"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}