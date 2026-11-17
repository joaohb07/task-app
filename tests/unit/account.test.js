describe('Email Account Service (src/emails/account.js)', () => {
    const originalEnv = process.env

    beforeEach(() => {
        jest.resetModules()
        process.env = { ...originalEnv }
    })

    afterAll(() => {
        process.env = originalEnv
    })

    it('should skip sending emails when SEND_EMAIL_API_KEY is not configured', async () => {
        delete process.env.SEND_EMAIL_API_KEY
        const sgMail = require('@sendgrid/mail')
        const sendSpy = jest.spyOn(sgMail, 'send').mockResolvedValue({})
        const { sendWelcomeEmail, sendFarewellEmail } = require('../../src/emails/account')

        await sendWelcomeEmail('test@example.com', 'João')
        await sendFarewellEmail('test@example.com', 'João')

        expect(sendSpy).not.toHaveBeenCalled()
    })

    it('should configure API key and send welcome and farewell emails when key is present', async () => {
        process.env.SEND_EMAIL_API_KEY = 'SG.fake-test-key'
        process.env.SEND_EMAIL_FROM = 'noreply@taskapp.local'

        const sgMail = require('@sendgrid/mail')
        const setApiKeySpy = jest.spyOn(sgMail, 'setApiKey').mockImplementation(() => {})
        const sendSpy = jest.spyOn(sgMail, 'send').mockResolvedValue({})

        const { sendWelcomeEmail, sendFarewellEmail } = require('../../src/emails/account')

        expect(setApiKeySpy).toHaveBeenCalledWith('SG.fake-test-key')

        await sendWelcomeEmail('joao@example.com', 'João')
        expect(sendSpy).toHaveBeenCalledWith({
            to: 'joao@example.com',
            from: 'noreply@taskapp.local',
            subject: 'Welcome to Task App',
            text: 'Welcome to the app, João! Hope you enjoy it!'
        })

        await sendFarewellEmail('joao@example.com', 'João')
        expect(sendSpy).toHaveBeenCalledWith({
            to: 'joao@example.com',
            from: 'noreply@taskapp.local',
            subject: 'Successfully Cancelled Task App Subscription',
            text: 'Farewell João! Hope to see you again!'
        })
    })

    it('should catch and log warning when SendGrid throws an error', async () => {
        process.env.SEND_EMAIL_API_KEY = 'SG.fake-test-key'
        const sgMail = require('@sendgrid/mail')
        jest.spyOn(sgMail, 'setApiKey').mockImplementation(() => {})
        jest.spyOn(sgMail, 'send').mockRejectedValue(new Error('SendGrid timeout'))
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

        const { sendWelcomeEmail, sendFarewellEmail } = require('../../src/emails/account')

        await sendWelcomeEmail('joao@example.com', 'João')
        await sendFarewellEmail('joao@example.com', 'João')

        expect(warnSpy).toHaveBeenCalledTimes(2)
        warnSpy.mockRestore()
    })
})