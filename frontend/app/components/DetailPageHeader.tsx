type DetailPageHeaderProps = {
	title: string
	year?: number | null
	textColumnShellClass: string
	textMeasureClass: string
}

export function DetailPageHeader({
	title,
	year,
	textColumnShellClass,
	textMeasureClass,
}: DetailPageHeaderProps) {
	const hasYear = year != null

	return (
		<header className={`${textColumnShellClass} mb-10 sm:mb-12`}>
			<h1
				className={`${textMeasureClass} text-base font-normal ${hasYear ? 'mb-1' : ''}`}
			>
				{title}
			</h1>
			{hasYear && (
				<p className={`${textMeasureClass} text-base`}>{year}</p>
			)}
		</header>
	)
}
