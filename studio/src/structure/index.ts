import {Asterisk, FlowerTulip, ListDashes, Spiral} from '@phosphor-icons/react'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      orderableDocumentListDeskItem({
        type: 'work',
        title: 'Work',
        icon: Spiral,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: 'ephemera',
        title: 'Ephemera',
        icon: FlowerTulip,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: 'exhibition',
        title: 'Exhibitions',
        icon: Asterisk,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: 'cvEntry',
        title: 'CV Entries',
        icon: ListDashes,
        S,
        context,
      }),
    ])
