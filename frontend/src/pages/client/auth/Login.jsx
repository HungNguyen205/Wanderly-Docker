import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export default function Login() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function handleChange(e) {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post("/api/auths/login", formData, { withCredentials: true });

            const { message, user, accessToken } = res.data;
            const saveUser = {
                FullName: user.FullName,
                Email: user.Email,
                RoleId: user.RoleId || user.roleId || null,
                UserId: user.id || user.id || null
            }

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem("user", JSON.stringify(saveUser));

            toast.success(message || "Login successfull.");
            setTimeout(() => navigate("/home"), 1500);

        } catch (err) {
            const errMsg = err.response?.data?.message || "Incorrect email or password. Please try again.";
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center px-4 py-10">
            <div className="glass-card w-full max-w-md p-8 animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4">
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-mint)] bg-clip-text text-transparent mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600">Sign in to your Wanderly account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="Enter email"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="Enter password"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" />
                            <span>Remember Me</span>
                        </label>
                        <a href="#" className="text-[var(--color-primary)] hover:text-[var(--color-mint)] transition">
                            Forgot password?
                        </a>
                    </div>

                    <button type="submit" className="btn-primary disabled:opacity-50" disabled={loading}>
                        {loading ? "Signing In..." : "Sign In"}
                    </button>

                    {/* Không cần message text ở đây nữa */}
                </form>

                <p className="text-center text-gray-600 mt-6">
                    Don’t have an account?{" "}
                    <a
                        href="/register"
                        className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-mint)]"
                    >
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}