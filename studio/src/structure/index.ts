import {Asterisk, FlowerTulip, ListDashes, Spiral} from '@phosphor-icons/react'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Work')
        .icon(Spiral)
        .child(
          S.documentTypeList('work').defaultOrdering([
            {field: 'year', direction: 'desc'},
          ]),
        ),
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
          S.documentTypeList('exhibition').defaultOrdering([
            {field: 'year', direction: 'desc'},
          ]),
        ),
      orderableDocumentListDeskItem({
        type: 'cvEntry',
        title: 'CV Entries',
        icon: ListDashes,
        S,
        context,
      }),
    ])
