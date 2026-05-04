import {
  Asterisk,
  FlowerTulip,
  House,
  ListDashes,
  Newspaper,
  Spiral,
  UserCircle,
} from '@phosphor-icons/react'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home')
        .icon(House)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem()
        .title('About')
        .icon(UserCircle)
        .child(
          S.document()
            .schemaType('about')
            .documentId('about')
            .title('about'),
        ),
      S.listItem()
        .title('Work')
        .icon(Spiral)
        .child(S.documentTypeList('work').defaultOrdering([{field: 'year', direction: 'desc'}])),
      orderableDocumentListDeskItem({
        type: 'ephemera',
        title: 'Ephemera',
        icon: FlowerTulip,
        S,
        context,
      }),
      S.listItem()
        .title('Exhibitions')
        .icon(Asterisk)
        .child(
          S.documentTypeList('exhibition').defaultOrdering([{field: 'year', direction: 'desc'}]),
        ),
      orderableDocumentListDeskItem({
        type: 'press',
        title: 'Press',
        icon: Newspaper,
        S,
        context,
      }),
      S.listItem()
        .title('CV Entries')
        .icon(ListDashes)
        .child(S.documentTypeList('cvEntry').defaultOrdering([{field: 'year', direction: 'desc'}])),
    ])
