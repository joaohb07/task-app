const sgMail = require('@sendgrid/mail')

const sendgridAPIKey = process.env.SEND_EMAIL_API_KEY
const senderEmail = process.env.SEND_EMAIL_FROM || 'joao.botelho@unesp.br'

if (sendgridAPIKey) {
    sgMail.setApiKey(sendgridAPIKey)
}

/**
 * Sends a welcome email if SendGrid is configured in the environment.
 */
const sendWelcomeEmail = async (email, name) => {
    if (!sendgridAPIKey) return

    try {
        await sgMail.send({
            to: email,
            from: senderEmail,
            subject: 'Welcome to Task App',
            text: `Welcome to the app, ${name}! Hope you enjoy it!`
        })
    } catch (error) {
        console.warn('Warning: Could not send welcome email:', error.message)
    }
}

/**
 * Sends a farewell email upon account deletion if SendGrid is configured.
 */
const sendFarewellEmail = async (email, name) => {
    if (!sendgridAPIKey) return

    try {
        await sgMail.send({
            to: email,
            from: senderEmail,
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