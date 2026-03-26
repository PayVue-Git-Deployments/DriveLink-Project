import twilio from 'twilio'

export async function sendSMS(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials not configured. Skipping SMS.')
    return
  }

  const client = twilio(accountSid, authToken)

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    })
    console.log(`SMS sent to ${to}: ${message.sid}`)
    return message
  } catch (error) {
    console.error('Twilio error:', error)
    throw error
  }
}
