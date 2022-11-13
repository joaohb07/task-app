// Import libs
const sgMail = require('@sendgrid/mail') // lib to manipulate SendGrid API to send emails

// SendGrid API key
const sendgridAPIKey = process.env.SEND_EMAIL_API_KEY
// Setup SendGrid API key
sgMail.setApiKey(sendgridAPIKey)

// Send Welcome Email function
const sendWelcomeEmail = (email, name) => {
    sgMail.send({ // SendGrid send method, to send the email
        to: email, // to user email
        from: 'joao.botelho@unesp.br', // from my personal email
        subject: 'Welcome to Task App', // email subject
        text: `Welcome to the app, ${name}! Hope you enjoy it!` // email body
    })
}

// Send Farewell Email function
const sendFarewellEmail = (email, name) => {
    sgMail.send({ // SendGrid send method, to send the email
        to: email, // to user email
        from: 'joao.botelho@unesp.br', // from my personal email
        subject: 'Succefully Cancelled Task App Subscription', // email subject
        text: `Farewell ${name}! Hope to see you again!` // email body
    })
}

// Export Email send
module.exports = {
    sendWelcomeEmail,
    sendFarewellEmail
}