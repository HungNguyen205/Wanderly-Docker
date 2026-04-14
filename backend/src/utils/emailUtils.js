const nodemailer = require('nodemailer');
// Giả định bạn có một file config riêng cho email
const emailConfig = require('../config/emailConfig');

// 1. Tạo transporter (cấu hình kết nối SMTP)
const transporter = nodemailer.createTransport(emailConfig);

// Thay đổi trong /utils/emailUtils.js

const sendOtpEmail = async (toEmail, otpCode, expiresAt) => {
    try {
        const expirationTime = new Date(expiresAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });

        const mailOptions = {
            from: emailConfig.auth.user,
            to: toEmail,
            subject: 'Yêu cầu đặt lại mật khẩu của bạn - [Tên Ứng dụng]', // Đổi tiêu đề
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                    <h2 style="color: #333; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Yêu cầu Đặt lại Mật khẩu</h2>
                    <p>Chào bạn,</p>
                    <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này. Để tiếp tục, vui lòng sử dụng mã xác nhận dưới đây:</p>
                    
                    <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f7f7f7; border-radius: 5px;">
                        <p style="font-size: 1.1em; color: #555;">Mã xác nhận (OTP) của bạn là:</p>
                        <h1 style="color: #3498db; font-size: 2.5em; margin: 5px 0;">${otpCode}</h1>
                    </div>
                    
                    <p style="text-align: center; color: #e74c3c; font-weight: bold;">
                        Mã này sẽ hết hạn vào lúc <b>${expirationTime}</b> (giờ Việt Nam).
                    </p>
                    
                    <p>Vui lòng nhập mã này vào trang đặt lại mật khẩu để hoàn tất quá trình.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="[LINK TRANG ĐẶT LẠI CỦA BẠN]" 
                           style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                           Hoàn tất Đặt lại Mật khẩu
                        </a>
                    </div>

                    <p style="margin-top: 30px;">
                        <b>Lưu ý quan trọng:</b> Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi. Vì lý do bảo mật, vui lòng không chia sẻ mã này với bất kỳ ai.
                    </p>

                    <hr style="margin-top: 20px; border: 0; border-top: 1px solid #eee;">
                    <p style="font-size: 0.8em; color: #777; text-align: center;">Hệ thống ${process.env.APP_NAME || 'Your App'}</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("Error sending OTP email:", error);
        return { success: false, error: error.message };
    }
};
// module.exports đã được cập nhật

// Send booking confirmation email (when booking is created - pending payment)
const sendBookingConfirmationEmail = async (bookingData) => {
    try {
        const {
            customerEmail,
            customerName,
            bookingCode,
            totalAmount,
            bookingItems,
            providerInfo,
            paymentLink
        } = bookingData;

        const formatPrice = (price) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0
            }).format(price || 0);
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatTime = (timeStr) => {
            if (!timeStr) return null;
            try {
                // If it's already in HH:mm or HH:mm:ss format
                if (typeof timeStr === 'string' && timeStr.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
                    return timeStr.substring(0, 5);
                }
                // If it's a datetime string (e.g., "1970-01-01T08:00:00.000Z" from SQL TIME)
                if (typeof timeStr === 'string' && timeStr.includes('T')) {
                    const timePart = timeStr.split('T')[1];
                    if (timePart) {
                        const cleanTime = timePart.replace(/[Z+-].*$/, '');
                        return cleanTime.substring(0, 5);
                    }
                }
                // Try to parse as Date if it's a valid date string
                const date = new Date(timeStr);
                if (!isNaN(date.getTime())) {
                    const hours = String(date.getUTCHours()).padStart(2, '0');
                    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                    return `${hours}:${minutes}`;
                }
                // Fallback: return first 5 characters if it's a string
                if (typeof timeStr === 'string') {
                    return timeStr.substring(0, 5);
                }
                return null;
            } catch (error) {
                return null;
            }
        };

        const formatTimeRange = (startTime, endTime) => {
            const start = formatTime(startTime);
            const end = formatTime(endTime);
            
            if (!start && !end) return 'Flexible';
            if (!start) return `Until ${end}`;
            if (!end) return start;
            return `${start} - ${end}`;
        };

        const itemsHtml = bookingItems.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; text-align: left;">
                    <strong>${item.ServiceName || 'Service'}</strong><br>
                    <small style="color: #666;">${item.CategoryName || ''}</small>
                </td>
                <td style="padding: 12px; text-align: center;">${formatDate(item.AvailabilityDate)}</td>
                <td style="padding: 12px; text-align: center;">${formatTimeRange(item.StartTime, item.EndTime)}</td>
                <td style="padding: 12px; text-align: center;">${item.Quantity}</td>
                <td style="padding: 12px; text-align: right;">${formatPrice(item.ItemTotal)}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"Wanderly Travel" <${emailConfig.auth.user}>`,
            to: customerEmail,
            subject: `Booking Confirmation - Payment Required | ${bookingCode}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Booking Confirmation</h1>
                                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Payment Required</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Dear <strong>${customerName}</strong>,
                                            </p>
                                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Thank you for your booking with Wanderly! We have received your booking request and it is currently pending payment.
                                            </p>
                                            
                                            <!-- Booking Code -->
                                            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
                                                <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Booking Code</p>
                                                <p style="margin: 0; color: #333; font-size: 24px; font-weight: 600; letter-spacing: 2px;">${bookingCode}</p>
                                            </div>
                                            
                                            <!-- Booking Details -->
                                            <h2 style="color: #333333; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Booking Details</h2>
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                                                <thead>
                                                    <tr style="background-color: #f8f9fa;">
                                                        <th style="padding: 12px; text-align: left; color: #333; font-weight: 600;">Service</th>
                                                        <th style="padding: 12px; text-align: center; color: #333; font-weight: 600;">Date</th>
                                                        <th style="padding: 12px; text-align: center; color: #333; font-weight: 600;">Time</th>
                                                        <th style="padding: 12px; text-align: center; color: #333; font-weight: 600;">Qty</th>
                                                        <th style="padding: 12px; text-align: right; color: #333; font-weight: 600;">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${itemsHtml}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td colspan="4" style="padding: 15px 12px; text-align: right; font-weight: 600; color: #333; border-top: 2px solid #667eea;">
                                                            Total Amount:
                                                        </td>
                                                        <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #667eea; border-top: 2px solid #667eea;">
                                                            ${formatPrice(totalAmount)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                            
                                            <!-- Payment CTA -->
                                            <div style="text-align: center; margin: 35px 0;">
                                                <a href="${paymentLink || '#'}" 
                                                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                                    Complete Payment Now
                                                </a>
                                            </div>
                                            
                                            <!-- Provider Contact -->
                                            ${providerInfo ? `
                                            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0;">
                                                <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Service Provider Contact</h3>
                                                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                                                    <strong>Company:</strong> ${providerInfo.CompanyName || 'N/A'}<br>
                                                    ${providerInfo.Email ? `<strong>Email:</strong> <a href="mailto:${providerInfo.Email}" style="color: #667eea;">${providerInfo.Email}</a><br>` : ''}
                                                    ${providerInfo.PhoneNumber ? `<strong>Phone:</strong> <a href="tel:${providerInfo.PhoneNumber}" style="color: #667eea;">${providerInfo.PhoneNumber}</a><br>` : ''}
                                                    ${providerInfo.Address ? `<strong>Address:</strong> ${providerInfo.Address}` : ''}
                                                </p>
                                                <p style="margin: 15px 0 0 0; color: #666; font-size: 13px; font-style: italic;">
                                                    You can contact the provider directly for any questions about your booking or to arrange a viewing.
                                                </p>
                                            </div>
                                            ` : ''}
                                            
                                            <!-- Important Notes -->
                                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                                                    <strong>⚠️ Important:</strong> Please complete your payment within 24 hours to secure your booking. Your booking will be automatically cancelled if payment is not received.
                                                </p>
                                            </div>
                                            
                                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                                                If you have any questions or need assistance, please don't hesitate to contact our support team.
                                            </p>
                                            
                                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                                                Best regards,<br>
                                                <strong>The Wanderly Team</strong>
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                            <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.6;">
                                                This is an automated email. Please do not reply to this message.<br>
                                                © ${new Date().getFullYear()} Wanderly Travel. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending booking confirmation email:", error);
        return { success: false, error: error.message };
    }
};

// Send payment confirmation email (when payment is successful)
const sendPaymentConfirmationEmail = async (bookingData) => {
    try {
        const {
            customerEmail,
            customerName,
            bookingCode,
            totalAmount,
            bookingItems,
            providerInfo,
            transactionDetails,
            bookingLink
        } = bookingData;

        const formatPrice = (price) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0
            }).format(price || 0);
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatTime = (timeStr) => {
            if (!timeStr) return null;
            try {
                // If it's already in HH:mm or HH:mm:ss format
                if (typeof timeStr === 'string' && timeStr.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
                    return timeStr.substring(0, 5);
                }
                // If it's a datetime string (e.g., "1970-01-01T08:00:00.000Z" from SQL TIME)
                if (typeof timeStr === 'string' && timeStr.includes('T')) {
                    const timePart = timeStr.split('T')[1];
                    if (timePart) {
                        const cleanTime = timePart.replace(/[Z+-].*$/, '');
                        return cleanTime.substring(0, 5);
                    }
                }
                // Try to parse as Date if it's a valid date string
                const date = new Date(timeStr);
                if (!isNaN(date.getTime())) {
                    const hours = String(date.getUTCHours()).padStart(2, '0');
                    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                    return `${hours}:${minutes}`;
                }
                // Fallback: return first 5 characters if it's a string
                if (typeof timeStr === 'string') {
                    return timeStr.substring(0, 5);
                }
                return null;
            } catch (error) {
                return null;
            }
        };

        const formatTimeRange = (startTime, endTime) => {
            const start = formatTime(startTime);
            const end = formatTime(endTime);
            
            if (!start && !end) return 'Flexible';
            if (!start) return `Until ${end}`;
            if (!end) return start;
            return `${start} - ${end}`;
        };

        const formatDateTime = (dateStr) => {
            if (!dateStr) return 'N/A';
            return new Date(dateStr).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const itemsHtml = bookingItems.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; text-align: left;">
                    <strong>${item.ServiceName || 'Service'}</strong><br>
                    <small style="color: #666;">${item.CategoryName || ''}</small>
                </td>
                <td style="padding: 12px; text-align: center;">${formatDate(item.AvailabilityDate)}</td>
                <td style="padding: 12px; text-align: center;">${formatTimeRange(item.StartTime, item.EndTime)}</td>
                <td style="padding: 12px; text-align: center;">${item.Quantity}</td>
                <td style="padding: 12px; text-align: right;">${formatPrice(item.ItemTotal)}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"Wanderly Travel" <${emailConfig.auth.user}>`,
            to: customerEmail,
            subject: `Payment Confirmed - Booking #${bookingCode} is Confirmed`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 auto 20px;">
                                                <tr>
                                                    <td style="text-align: center; padding: 0;">
                                                        <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                                                            <tr>
                                                                <td style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; text-align: center; vertical-align: middle; padding: 0;">
                                                                    <span style="font-size: 40px; color: #10b981; line-height: 80px; display: inline-block;">✓</span>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Payment Confirmed!</h1>
                                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your booking is now confirmed</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Dear <strong>${customerName}</strong>,
                                            </p>
                                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Great news! Your payment has been successfully processed and your booking is now confirmed. We're excited to have you with us!
                                            </p>
                                            
                                            <!-- Booking Code -->
                                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
                                                <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Booking Code</p>
                                                <p style="margin: 0; color: #333; font-size: 24px; font-weight: 600; letter-spacing: 2px;">${bookingCode}</p>
                                                <p style="margin: 10px 0 0 0; color: #10b981; font-size: 14px; font-weight: 600;">✓ Confirmed</p>
                                            </div>
                                            
                                            <!-- Payment Details -->
                                            ${transactionDetails ? `
                                            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0;">
                                                <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Payment Details</h3>
                                                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                                                    <strong>Payment Method:</strong> ${transactionDetails.PaymentMethod || 'N/A'}<br>
                                                    <strong>Gateway:</strong> ${transactionDetails.GatewayName || 'N/A'}<br>
                                                    <strong>Amount Paid:</strong> ${formatPrice(transactionDetails.Amount || totalAmount)}<br>
                                                    <strong>Transaction Date:</strong> ${formatDateTime(transactionDetails.TransactionDate)}
                                                </p>
                                            </div>
                                            ` : ''}
                                            
                                            <!-- Booking Details -->
                                            <h2 style="color: #333333; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Your Booking Details</h2>
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                                                <thead>
                                                    <tr style="background-color: #f8f9fa;">
                                                        <th style="padding: 12px; text-align: left; color: #333; font-weight: 600;">Service</th>
                                                        <th style="padding: 12px; text-align: center; color: #333; font-weight: 600;">Date</th>
                                                        <th style="padding: 12px; text-align: center; color: #333; font-weight: 600;">Time</th>
                                                        <th style="padding: 12px; text-align: center; color: #333; font-weight: 600;">Qty</th>
                                                        <th style="padding: 12px; text-align: right; color: #333; font-weight: 600;">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${itemsHtml}
                                                </tbody>
                                                <tfoot>
                                                    <tr>
                                                        <td colspan="4" style="padding: 15px 12px; text-align: right; font-weight: 600; color: #333; border-top: 2px solid #10b981;">
                                                            Total Amount:
                                                        </td>
                                                        <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #10b981; border-top: 2px solid #10b981;">
                                                            ${formatPrice(totalAmount)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                            
                                            <!-- Provider Contact -->
                                            ${providerInfo ? `
                                            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0;">
                                                <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Service Provider Contact</h3>
                                                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                                                    <strong>Company:</strong> ${providerInfo.CompanyName || 'N/A'}<br>
                                                    ${providerInfo.Email ? `<strong>Email:</strong> <a href="mailto:${providerInfo.Email}" style="color: #10b981; text-decoration: none;">${providerInfo.Email}</a><br>` : ''}
                                                    ${providerInfo.PhoneNumber ? `<strong>Phone:</strong> <a href="tel:${providerInfo.PhoneNumber}" style="color: #10b981; text-decoration: none;">${providerInfo.PhoneNumber}</a><br>` : ''}
                                                    ${providerInfo.Address ? `<strong>Address:</strong> ${providerInfo.Address}` : ''}
                                                </p>
                                                <p style="margin: 15px 0 0 0; color: #666; font-size: 13px; font-style: italic;">
                                                    You can contact the provider directly for any questions about your booking or to arrange a viewing.
                                                </p>
                                            </div>
                                            ` : ''}
                                            
                                            <!-- View Booking CTA -->
                                            ${bookingLink ? `
                                            <div style="text-align: center; margin: 35px 0;">
                                                <a href="${bookingLink}" 
                                                   style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                                    View Booking Details
                                                </a>
                                            </div>
                                            ` : ''}
                                            
                                            <!-- Important Notes -->
                                            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                                <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                                                    <strong>📋 What's Next?</strong><br>
                                                    • Your booking is confirmed and ready to use<br>
                                                    • Please arrive on time for your scheduled service<br>
                                                    • Keep this email for your records<br>
                                                    • Contact the provider if you need to make any changes
                                                </p>
                                            </div>
                                            
                                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                                                We look forward to serving you! If you have any questions or need assistance, please don't hesitate to contact our support team.
                                            </p>
                                            
                                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                                                Best regards,<br>
                                                <strong>The Wanderly Team</strong>
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                            <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.6;">
                                                This is an automated email. Please do not reply to this message.<br>
                                                © ${new Date().getFullYear()} Wanderly Travel. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Payment confirmation email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending payment confirmation email:", error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOtpEmail,
    sendBookingConfirmationEmail,
    sendPaymentConfirmationEmail,
};