import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/client/Layout/Header';
import { toast } from 'react-toastify';

const ProviderContract = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [providerData, setProviderData] = useState(null);
    const [signature, setSignature] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [agreedToLegalRepresentative, setAgreedToLegalRepresentative] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedProviderData = localStorage.getItem('providerRegistrationData');

        if (!savedUser) {
            toast.info('Please login first');
            navigate('/login');
            return;
        }

        if (!savedProviderData) {
            toast.info('Please complete registration form first');
            navigate('/provider/register');
            return;
        }

        try {
            setUser(JSON.parse(savedUser));
            const data = JSON.parse(savedProviderData);
            setProviderData(data);
            setSignature(data.repName || '');
        } catch (e) {
            console.error('Error parsing data:', e);
            navigate('/provider/register');
        }
    }, [navigate]);

    const updateSignaturePreview = (name) => {
        // This will be handled by the component state
        return name || '...';
    };

    const handleSign = async (e) => {
        e.preventDefault();

        if (!signature.trim()) {
            toast.error('Please enter your full name');
            return;
        }

        if (!agreedToLegalRepresentative) {
            toast.error('Please confirm that you are the legal representative of this enterprise');
            return;
        }

        if (!agreedToTerms) {
            toast.error('Please agree to all terms and conditions in the contract and the revenue sharing ratio (15/85)');
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Prepare request body - matching database schema
            const requestBody = {
                CompanyName: providerData.companyName,
                PhoneNumber: providerData.businessPhone,
                ContactEmail: providerData.contactEmail || providerData.email,
                Address: providerData.headquartersAddress,
                BusinessLicense: providerData.businessLicense, // May be stored separately or in a different table
                RepresentativeName: signature, // May be stored separately or in a different table
            };

            console.log('Calling API: /api/providers/register');
            console.log('Request body:', requestBody);

            // Call API to register provider and sign contract
            const res = await fetch('/api/providers/register', {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();

            console.log('API Response status:', res.status);
            console.log('API Response data:', data);

            if (res.ok) {
                // Update user roleId
                const updatedUser = { ...user, RoleId: 3, roleId: 3 };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Clear registration data
                localStorage.removeItem('providerRegistrationData');

                // Show success modal
                setShowSuccessModal(true);
                toast.success('Contract signed successfully!');
            } else {
                const errorMessage = data.message || data.error || 'Failed to sign contract. Please try again.';
                console.error('API Error:', errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error signing contract:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!providerData || !user) {
        return null;
    }

    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth() + 1;

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-2xl text-rose-500">edit_document</span>
                        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Electronic Contract Signing</span>
                    </div>
                </header>

                <main className="flex-1 py-8 px-4 flex justify-center items-start">
                    <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Contract Document */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[85vh]">
                            {/* Toolbar */}
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">DRAFT</span>
                                    <h2 className="font-bold text-sm text-gray-700 dark:text-gray-200">HĐ-HTKD-2025/WANDERLY</h2>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500"
                                        title="Print"
                                    >
                                        <span className="material-symbols-outlined text-sm">print</span>
                                    </button>
                                    <button
                                        onClick={() => toast.info('Download feature coming soon')}
                                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500"
                                        title="Download"
                                    >
                                        <span className="material-symbols-outlined text-sm">download</span>
                                    </button>
                                </div>
                            </div>

                            {/* Contract Content */}
                            <div className="p-10 overflow-y-auto text-sm leading-relaxed text-gray-900 dark:text-gray-300 text-justify bg-white dark:bg-gray-900" style={{ fontFamily: "'Noto Serif', serif" }}>
                                {/* Quốc hiệu tiêu ngữ */}
                                <div className="text-center mb-6">
                                    <p className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                    <p className="font-bold underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
                                </div>

                                <div className="text-center mb-6">
                                    <h1 className="font-bold text-xl uppercase mb-2">HỢP ĐỒNG HỢP TÁC KINH DOANH</h1>
                                    <p className="italic">(Phát triển và khai thác hệ thống du lịch tự túc Wanderly)</p>
                                    <p className="mt-2">Số: <span className="font-bold text-blue-700 dark:text-blue-400">089</span>/2025/HĐ-HTKD</p>
                                </div>

                                <div className="mb-4">
                                    <p className="font-bold italic">Căn cứ:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Bộ luật Dân sự 2015;</li>
                                        <li>Luật Thương mại 2005;</li>
                                        <li>Luật Công nghệ thông tin 2006;</li>
                                        <li>Nhu cầu hợp tác giữa các bên nhằm phát triển, vận hành và khai thác nền tảng du lịch tự túc Wanderly;</li>
                                    </ul>
                                    <p className="mt-2">Trên tinh thần thiện chí, hợp tác bình đẳng và cùng có lợi.</p>
                                </div>

                                <p className="mb-2">
                                    Hôm nay, ngày <span className="font-bold text-blue-700 dark:text-blue-400">{currentDate}</span> tháng{' '}
                                    <span className="font-bold text-blue-700 dark:text-blue-400">{currentMonth}</span> năm 2025, chúng tôi gồm:
                                </p>

                                {/* Bên A */}
                                <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50">
                                    <p className="font-bold uppercase mb-2">1. CÔNG TY TNHH WANDERLY TECHNOLOGY (Bên A)</p>
                                    <table className="w-full">
                                        <tbody>
                                            <tr>
                                                <td className="w-32 align-top">Trụ sở:</td>
                                                <td>Tầng 12, Tòa nhà Bitexco, Q.1, TP.HCM</td>
                                            </tr>
                                            <tr>
                                                <td>GCNĐKKD số:</td>
                                                <td>0312345678 do Sở KH&ĐT TP.HCM cấp ngày 01/01/2024</td>
                                            </tr>
                                            <tr>
                                                <td>Đại diện:</td>
                                                <td>
                                                    Ông <span className="font-bold">Nguyễn Văn Admin</span> - Chức vụ: Giám đốc
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Điện thoại:</td>
                                                <td>1900 1234</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Bên B (Dynamic Data) */}
                                <div className="mb-6 p-4 border border-blue-200 dark:border-blue-900 rounded bg-blue-50 dark:bg-blue-900/20">
                                    <p className="font-bold uppercase mb-2">
                                        2. <span className="font-bold text-blue-700 dark:text-blue-400">{providerData.companyName.toUpperCase()}</span> (Bên B)
                                    </p>
                                    <table className="w-full">
                                        <tbody>
                                            <tr>
                                                <td className="w-32 align-top">Trụ sở:</td>
                                                <td>
                                                    <span className="font-bold text-blue-700 dark:text-blue-400">
                                                        {providerData.headquartersAddress || 'Chưa cung cấp'}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>MST/ĐKKD:</td>
                                                <td>
                                                    <span className="font-bold text-blue-700 dark:text-blue-400">0109876543</span> (Đang chờ xác thực bản cứng)
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Đại diện:</td>
                                                <td>
                                                    Ông/Bà <span className="font-bold text-blue-700 dark:text-blue-400">{signature || providerData.repName}</span> - Chức vụ: Giám đốc
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Điện thoại:</td>
                                                <td>
                                                    <span className="font-bold text-blue-700 dark:text-blue-400">{providerData.businessPhone}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <p className="mb-4">Cùng thoả thuận ký Hợp đồng hợp tác kinh doanh này với các điều khoản và điều kiện sau đây:</p>

                                {/* Điều khoản */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-bold uppercase">Điều 1. Mục tiêu và phạm vi hợp tác</h3>
                                        <p>
                                            1.1 Hai bên hợp tác phát triển, vận hành và khai thác nền tảng du lịch tự túc Wanderly, bao gồm: Quản lý tour,
                                            đặt phòng, AI gợi ý hành trình...
                                        </p>
                                        <p>1.2 Hai bên phối hợp kinh doanh, chia sẻ doanh thu và dữ liệu theo thỏa thuận.</p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold uppercase">Điều 2. Thời hạn hợp đồng</h3>
                                        <p>
                                            Thời hạn hợp tác: <span className="font-bold text-blue-700 dark:text-blue-400">05 năm</span>, kể từ ngày ký. Có thể gia hạn bằng văn bản.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold uppercase">Điều 3. Phân chia kết quả kinh doanh</h3>
                                        <p>
                                            3.1. <strong>Bên A</strong> góp công nghệ, thương hiệu, hạ tầng server.
                                        </p>
                                        <p>
                                            3.2. <strong>Bên B</strong> góp dịch vụ du lịch (tour, phòng, vé) và nhân lực vận hành.
                                        </p>
                                        <p>
                                            3.3. <strong>Tỷ lệ phân chia doanh thu:</strong>
                                        </p>
                                        <ul className="list-disc pl-8">
                                            <li>
                                                Bên A (Wanderly): <span className="font-bold text-blue-700 dark:text-blue-400">15%</span> (Phí nền tảng/Hoa hồng)
                                            </li>
                                            <li>
                                                Bên B (Đối tác): <span className="font-bold text-blue-700 dark:text-blue-400">85%</span> (Trên giá trị đơn hàng thực tế)
                                            </li>
                                        </ul>
                                        <p>Doanh thu được đối soát và thanh toán vào ngày 05 và 20 hàng tháng.</p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold uppercase">Điều 4. Quyền và nghĩa vụ</h3>
                                        <p>
                                            <strong>Bên A:</strong> Đảm bảo hệ thống hoạt động ổn định 24/7, bảo mật dữ liệu khách hàng, marketing nền tảng.
                                        </p>
                                        <p>
                                            <strong>Bên B:</strong> Cung cấp dịch vụ đúng cam kết, chịu trách nhiệm về chất lượng dịch vụ với khách hàng cuối, cập nhật lịch trống và giá chính xác.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-bold uppercase">Điều 9. Hiệu lực Hợp đồng</h3>
                                        <p>Hợp đồng này có hiệu lực kể từ thời điểm Bên B thực hiện ký số điện tử trên hệ thống.</p>
                                    </div>
                                </div>

                                {/* Chữ ký */}
                                <div className="mt-12 grid grid-cols-2 gap-8 text-center">
                                    <div>
                                        <p className="font-bold uppercase mb-12">ĐẠI DIỆN BÊN A</p>
                                        <div className="inline-block border-2 border-red-500 text-red-500 px-4 py-2 rounded -rotate-12 opacity-80 font-bold mb-2">
                                            ĐÃ KÝ SỐ <br /> Wanderly Tech
                                        </div>
                                        <p className="font-bold">Nguyễn Văn Admin</p>
                                    </div>
                                    <div>
                                        <p className="font-bold uppercase mb-12">ĐẠI DIỆN BÊN B</p>
                                        <div
                                            className={`h-20 flex items-center justify-center mx-auto w-48 rounded border ${signature
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-lg italic font-bold'
                                                : 'border-dashed border-gray-300 dark:border-gray-600 text-gray-400 italic bg-gray-50 dark:bg-gray-800'
                                                }`}
                                            style={signature ? { fontFamily: "'Noto Serif', serif" } : {}}
                                        >
                                            {signature || '(Chờ ký số...)'}
                                        </div>
                                        <p className="font-bold mt-2">{signature || '...'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Sign Form */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm">
                                <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                    <span className="material-symbols-outlined">verified_user</span> Legal Verification
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-2 text-justify">
                                    This contract is automatically generated based on the information you provided. Digital signatures have the same legal value as handwritten signatures according to the Law on Electronic Transactions.
                                </p>
                            </div>

                            {/* Sign Form */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-24">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Sign Contract</h3>

                                <form onSubmit={handleSign}>
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            Representative's Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={signature}
                                            onChange={(e) => setSignature(e.target.value)}
                                            required
                                            placeholder="Enter full name..."
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-lg italic focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                                            style={{ fontFamily: "'Noto Serif', serif" }}
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">This name will be inserted into Party B's signature section.</p>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={agreedToLegalRepresentative}
                                                onChange={(e) => setAgreedToLegalRepresentative(e.target.checked)}
                                                className="mt-1 w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-rose-500"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                                                I confirm that I am the legal representative of this enterprise.
                                            </span>
                                        </label>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="mt-1 w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-rose-500"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                                                I agree to all terms and conditions in the contract and the revenue sharing ratio (15/85).
                                            </span>
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 px-5 text-white font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-rose-500 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">ink_pen</span>
                                                Sign & Activate Now
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center animate-scale-in">
                            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4 animate-bounce">
                                <span className="material-symbols-outlined text-3xl">verified</span>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Contract Signed!</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Your Provider account has been successfully activated. You can start posting services now.
                            </p>
                            <button
                                onClick={() => {
                                    navigate('/provider');
                                }}
                                className="block w-full py-3 bg-gradient-to-r from-cyan-400 to-rose-500 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ProviderContract;

