const nodemailer = require('nodemailer')

/**
 * Returns the email address to be used as the sender.
 * @returns {string} The sender email address.
 */
const getSenderEmail = () =>
    process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@taskapp.local'

/**
 * Creates a configured Nodemailer transporter using environment SMTP credentials.
 * @returns {nodemailer.Transporter|null} A Nodemailer transporter or null if credentials are missing.
 */
const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null
    }

    const port = Number(SMTP_PORT) || 587

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    })
}

/**
 * Sends a welcome email when a new user registers.
 * Silently skips if SMTP credentials are not configured.
 *
 * @param {string} email - Recipient email address.
 * @param {string} name - Recipient display name.
 * @returns {Promise<void>} Resolves once the email is sent or skipped.
 */
const sendWelcomeEmail = async (email, name) => {
    const transporter = createTransporter()
    if (!transporter) return

    try {
        await transporter.sendMail({
            from: `"Task App" <${getSenderEmail()}>`,
            to: email,
            subject: 'Welcome to Task App',
            text: `Welcome to the app, ${name}! Hope you enjoy it!`
        })
    } catch (error) {
        console.warn('Warning: Could not send welcome email:', error.message)
    }
}

/**
 * Sends a farewell email upon user account deletion.
 * Silently skips if SMTP credentials are not configured.
 *
 * @param {string} email - Recipient email address.
 * @param {string} name - Recipient display name.
 * @returns {Promise<void>} Resolves once the email is sent or skipped.
 */
const sendFarewellEmail = async (email, name) => {
    const transporter = createTransporter()
    if (!transporter) return

    try {
        await transporter.sendMail({
            from: `"Task App" <${getSenderEmail()}>`,
            to: email,
            subject: 'Successfully Cancelled Task App Subscription',
            text: `Farewell ${name}! Hope to see you again!`
        })
    } catch (error) {
        console.warn('Warning: Could not send farewell email:', error.message)
    }
}

module.exports = {
    sendWelcomeEmail,
    sendFarewellEmail
}