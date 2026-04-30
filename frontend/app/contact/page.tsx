import type {Metadata} from 'next'

export const metadata: Metadata = {title: 'Contact'}

export default function ContactPage () {
	return (
		<div className="px-5 py-8 max-w-2xl">
			<h1 className="sr-only">Contact</h1>
			<ul className="flex flex-col gap-4 text-base">
				<li>
					<a
						href="https://www.instagram.com/_gery_georgieva/"
						target="_blank"
						rel="noopener noreferrer"
						className="underline-offset-4 hover:underline"
					>
						Instagram
					</a>
				</li>
				<li>
					<a
						href="mailto:emailgery@gmail.com"
						className="underline-offset-4 hover:underline"
					>
						Email
					</a>
				</li>
			</ul>
		</div>
	)
}
