import { Static, Type } from '@sinclair/typebox'

import { Simplify } from './shared'

export const LanguageSchema = Type.Object({
  languages_code: Type.String(),
  label: Type.String(),
})

export const LanguageListSchema = Type.Array(LanguageSchema)

export type Language = Simplify<Static<typeof LanguageSchema>>
export type LanguageList = Simplify<Static<typeof LanguageListSchema>>
