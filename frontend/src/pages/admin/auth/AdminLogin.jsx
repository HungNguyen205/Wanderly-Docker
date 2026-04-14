import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminLogin() {
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
            // Try admin-specific endpoint first, fallback to regular login if needed
            const res = await axios.post("/api/auths/admin/login", formData, { withCredentials: true });

            const { message, user, accessToken } = res.data;
            const saveUser = {
                FullName: user.FullName,
                Email: user.Email,
                Role: user.Role || 'admin'
            }

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem("adminUser", JSON.stringify(saveUser));
            // Also save as user for compatibility if needed
            localStorage.setItem("user", JSON.stringify(saveUser));

            toast.success(message || "Admin login successful.");
            setTimeout(() => navigate("/admin/dashboard"), 1500);

        } catch (err) {
            const errMsg = err.response?.data?.message || "Incorrect email or password. Please try again.";
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnHover
                theme="colored"
            />
            <div className="gradient-bg min-h-screen flex items-center justify-center px-4 py-10">
            <div className="glass-card w-full max-w-md p-8 animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-mint)]">
                            admin_panel_settings
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-mint)] bg-clip-text text-transparent mb-2">
                        Admin Panel
                    </h1>
                    <p className="text-gray-600">Sign in to access the admin dashboard</p>
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
                            placeholder="Enter admin email"
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
                </form>

                <p className="text-center text-gray-600 mt-6 text-sm">
                    Need help? Contact system administrator
                </p>
            </div>
        </div>
        </>
    );
}

