export default function SiteCopyright() {
  const year = new Date().getFullYear()
  return (
    <p className="m-0 mt-10 text-left text-base text-[var(--color-ink)] whitespace-nowrap">
      © {year} Gery Georgieva
    </p>
  )
}
