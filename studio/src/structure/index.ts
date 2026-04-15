import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Gery Georgieva')
    .items([
      S.listItem()
        .title('Work')
        .schemaType('work')
        .child(S.documentTypeList('work').title('Work')),
      S.listItem()
        .title('Ephemera')
        .schemaType('ephemera')
        .child(S.documentTypeList('ephemera').title('Ephemera')),
      S.divider(),
      S.listItem()
        .title('Exhibitions')
        .schemaType('exhibition')
        .child(S.documentTypeList('exhibition').title('Exhibitions')),
      S.divider(),
      S.listItem()
        .title('CV Entries')
        .schemaType('cvEntry')
        .child(S.documentTypeList('cvEntry').title('CV Entries')),
    ])
