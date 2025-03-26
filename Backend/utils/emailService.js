// const nodemailer = require('nodemailer');

// // Create test account and configure transporter
// async function createTransporter() {
//     try {
//         // Create test account
//         const testAccount = await nodemailer.createTestAccount();
//         console.log('Test email account created:', testAccount.user);

//         // Create transporter
//         const transporter = nodemailer.createTransport({
//             host: 'smtp.ethereal.email',
//             port: 587,
//             secure: false,
//             auth: {
//                 user: testAccount.user,
//                 pass: testAccount.pass
//             }
//         });

//         return transporter;
//     } catch (error) {
//         console.error('Failed to create email transporter:', error);
//         throw error;
//     }
// }

// let emailTransporter = null;

// // Initialize transporter
// createTransporter()
//     .then(transporter => {
//         emailTransporter = transporter;
//         console.log('Email service initialized successfully');
//     })
//     .catch(error => {
//         console.error('Email service initialization failed:', error);
//     });

// // Send visit request notification
// const sendVisitRequestEmail = async (hostEmail, visitorData) => {
//     try {
//         if (!emailTransporter) {
//             throw new Error('Email service not initialized');
//         }

//         const emailContent = `
//             <div style="font-family: Arial, sans-serif;">
//                 <h2>New Visit Request</h2>
//                 <p>You have received a new visit request with the following details:</p>
//                 <ul>
//                     <li><strong>Visitor:</strong> ${visitorData.name}</li>
//                     <li><strong>Company:</strong> ${visitorData.company}</li>
//                     <li><strong>Purpose:</strong> ${visitorData.purpose}</li>
//                     <li><strong>Contact:</strong> ${visitorData.contact}</li>
//                     <li><strong>Time:</strong> ${new Date(visitorData.checkIn).toLocaleString()}</li>
//                 </ul>
//                 <p><strong>Action Required:</strong> Please review and respond to this request.</p>
//             </div>
//         `;

//         const info = await emailTransporter.sendMail({
//             from: '"VMS System" <test@vms.com>',
//             to: hostEmail,
//             subject: `New Visit Request - ${visitorData.name} from ${visitorData.company}`,
//             html: emailContent
//         });

//         console.log('Message sent successfully');
//         console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

//         return {
//             success: true,
//             messageId: info.messageId,
//             previewUrl: nodemailer.getTestMessageUrl(info)
//         };

//     } catch (error) {
//         console.error('Error sending email:', error);
//         return {
//             success: false,
//             error: error.message
//         };
//     }
// };

// // Send request status notification
// const sendRequestStatusEmail = async (visitorEmail, status, visitData) => {
//     try {
//         if (!emailTransporter) {
//             throw new Error('Email service not initialized');
//         }

//         const statusText = status === 'approved' ? 'Approved' : 'Denied';
//         const emailContent = `
//             <div style="font-family: Arial, sans-serif;">
//                 <h2>Visit Request ${statusText}</h2>
//                 <p>Your visit request has been ${status}.</p>
//                 <div style="margin: 20px 0;">
//                     <p><strong>Host:</strong> ${visitData.hostName}</p>
//                     <p><strong>Purpose:</strong> ${visitData.purpose}</p>
//                     <p><strong>Time:</strong> ${new Date(visitData.checkIn).toLocaleString()}</p>
//                 </div>
//                 ${status === 'approved' ? '<p>Please proceed to the reception desk at your scheduled time.</p>' : ''}
//             </div>
//         `;

//         const info = await emailTransporter.sendMail({
//             from: '"VMS System" <test@vms.com>',
//             to: visitorEmail,
//             subject: `Visit Request ${statusText}`,
//             html: emailContent
//         });

//         console.log('Status notification sent successfully');
//         console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

//         return {
//             success: true,
//             messageId: info.messageId,
//             previewUrl: nodemailer.getTestMessageUrl(info)
//         };

//     } catch (error) {
//         console.error('Error sending status email:', error);
//         return {
//             success: false,
//             error: error.message
//         };
//     }
// };

// module.exports = {
//     sendVisitRequestEmail,
//     sendRequestStatusEmail
// };