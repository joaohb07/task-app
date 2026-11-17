const nodemailer = require('nodemailer')
const { sendWelcomeEmail, sendFarewellEmail } = require('../../src/emails/account')

jest.mock('nodemailer')

describe('Email Account Service (src/emails/account.js)', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.clearAllMocks()
        process.env = { ...originalEnv }
        delete process.env.SMTP_FROM
    })

    afterAll(() => {
        process.env = originalEnv
    })

    it('should skip sending emails when SMTP credentials are not configured', async () => {
        delete process.env.SMTP_HOST
        delete process.env.SMTP_USER
        delete process.env.SMTP_PASS

        await sendWelcomeEmail('test@example.com', 'João')
        await sendFarewellEmail('test@example.com', 'João')

        expect(nodemailer.createTransport).not.toHaveBeenCalled()
    })

    it('should create SMTP transporter and send welcome and farewell emails', async () => {
        process.env.SMTP_HOST = 'smtp.gmail.com'
        process.env.SMTP_PORT = '587'
        process.env.SMTP_USER = 'sender@taskapp.local'
        process.env.SMTP_PASS = 'app-secret-pass'

        const sendMailMock = jest.fn().mockResolvedValue({ messageId: '123' })
        nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock })

        await sendWelcomeEmail('joao@example.com', 'João')
        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'sender@taskapp.local',
                pass: 'app-secret-pass'
            }
        })
        expect(sendMailMock).toHaveBeenCalledWith({
            from: '"Task App" <sender@taskapp.local>',
            to: 'joao@example.com',
            subject: 'Welcome to Task App',
            text: 'Welcome to the app, João! Hope you enjoy it!'
        })

        await sendFarewellEmail('joao@example.com', 'João')
        expect(sendMailMock).toHaveBeenCalledWith({
            from: '"Task App" <sender@taskapp.local>',
            to: 'joao@example.com',
            subject: 'Successfully Cancelled Task App Subscription',
            text: 'Farewell João! Hope to see you again!'
        })
    })

    it('should catch and log warning when SMTP transport fails', async () => {
        process.env.SMTP_HOST = 'smtp.gmail.com'
        process.env.SMTP_PORT = '465'
        process.env.SMTP_USER = 'sender@taskapp.local'
        process.env.SMTP_PASS = 'app-secret-pass'

        const sendMailMock = jest.fn().mockRejectedValue(new Error('SMTP connection timeout'))
        nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock })
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

        await sendWelcomeEmail('joao@example.com', 'João')
        await sendFarewellEmail('joao@example.com', 'João')

        expect(warnSpy).toHaveBeenCalledTimes(2)
        warnSpy.mockRestore()
    })
})