const checklistItems = [
  'Create an exhibition document for each keeper legacy work.',
  'Hide the old legacy work document.',
  'Update the homepage carousel reference to the new exhibition.',
  'Confirm the item appears correctly in /work.',
]

export function WorkMigrationChecklist() {
  return (
    <section style={{padding: '1.5rem', maxWidth: '42rem'}}>
      <h1 style={{fontSize: '1.25rem', margin: '0 0 1rem'}}>Work migration checklist</h1>
      <ol style={{display: 'grid', gap: '0.75rem', margin: 0, paddingLeft: '1.25rem'}}>
        {checklistItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  )
}
