import {revalidateTag} from 'next/cache'
import {type NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

type SanityWebhookPayload = {
  _id: string
  _type: string
}

export async function POST(req: NextRequest) {
  try {
    // Pass `true` as the third argument to add a propagation delay,
    // preventing stale CDN responses immediately after a publish event.
    const {isValidSignature, body} = await parseBody<SanityWebhookPayload>(
      req,
      process.env.SANITY_WEBHOOK_SECRET,
      true,
    )

    if (!isValidSignature) {
      return NextResponse.json({message: 'Invalid signature'}, {status: 401})
    }

    if (!body?._id || !body?._type) {
      return NextResponse.json({message: 'Bad request — missing _id or _type'}, {status: 400})
    }

    // Tag-based revalidation: sanityFetch from defineLive automatically
    // tags every response with the document _id and _type, so these two
    // calls surgically bust only the affected cached responses.
    revalidateTag(body._id, {})
    revalidateTag(body._type, {})

    return NextResponse.json({
      status: 200,
      revalidated: true,
      tags: [body._id, body._type],
      now: Date.now(),
    })
  } catch (err: unknown) {
    console.error(err)
    return NextResponse.json(
      {message: err instanceof Error ? err.message : 'Unknown error'},
      {status: 500},
    )
  }
}
