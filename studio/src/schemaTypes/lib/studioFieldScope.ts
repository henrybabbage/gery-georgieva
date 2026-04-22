import type {FieldProps} from 'sanity'
import {createElement} from 'react'

export function studioFieldScope(fieldName: string) {
  return function ScopedStudioField(props: FieldProps) {
    return createElement(
      'div',
      {'data-studio-field': fieldName},
      props.renderDefault(props),
    )
  }
}
