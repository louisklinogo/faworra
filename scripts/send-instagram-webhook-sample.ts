import 'dotenv/config'
import crypto from 'node:crypto'

function sign(body: string, secret: string) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
}

async function main() {
  const url = process.env.API_URL || 'http://localhost:3001'
  const secret = process.env.INSTAGRAM_APP_SECRET || ''
  if (!secret) {
    console.error('INSTAGRAM_APP_SECRET missing')
    process.exit(1)
  }
  const instagramUserId = process.env.IG_TEST_BUSINESS_ID || '17841400000000000'
  const senderId = process.env.IG_TEST_SENDER_ID || instagramUserId
  const now = Date.now()
  const mediaUrl = process.env.IG_TEST_MEDIA_URL
  const attachments = mediaUrl
    ? [
        {
          type: 'image',
          payload: { url: mediaUrl },
        },
      ]
    : []

  const payload = [
    {
      id: instagramUserId,
      time: now,
      messaging: [
        {
          sender: { id: senderId },
          recipient: { id: instagramUserId },
          timestamp: now,
          message: {
            mid: 'm_' + now,
            text: 'hello from scripted webhook',
            attachments,
          },
        },
      ],
    },
  ]
  const body = JSON.stringify({ object: 'instagram', entry: payload })
  const signature = sign(body, secret)
  const res = await fetch(url + '/webhooks/meta', {
    method: 'POST',
    headers: {
      'x-hub-signature-256': signature,
      'content-type': 'application/json',
    },
    body,
  })
  const text = await res.text()
  console.log(res.status, text)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
