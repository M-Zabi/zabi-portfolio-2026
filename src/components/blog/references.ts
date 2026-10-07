import type { InjectionKey, Ref } from 'vue'

import type { PostReference } from '@/types/blog'

/** The article's reference list, provided by `PostBody` so inline markers can preview sources. */
export const referencesKey: InjectionKey<Ref<PostReference[]>> = Symbol('post-references')
