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


export const ABOUT_DOCUMENT_ID = 'about'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home')
        .icon(House)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem()
        .title('CV Page')
        .icon(UserCircle)
        .child(
          S.document()
            .schemaType('about')
            .documentId(ABOUT_DOCUMENT_ID)
            .title('CV Page'),
        ),
      S.listItem()
        .title('Work')
        .icon(Asterisk)
        .child(
          S.documentTypeList('exhibition').defaultOrdering([{field: 'year', direction: 'desc'}]),
        ),
      S.listItem()
        .title('Legacy Works (Hidden)')
        .icon(Spiral)
        .child(S.documentTypeList('work').defaultOrdering([{field: 'year', direction: 'desc'}])),
      orderableDocumentListDeskItem({
        type: 'ephemera',
        title: 'Ephemera',
        icon: FlowerTulip,
        S,
        context,
      }),
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
