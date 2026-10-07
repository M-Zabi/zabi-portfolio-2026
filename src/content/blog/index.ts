import type { Post } from '@/types/blog'

import { post as designTools } from './ai-design-tools-stack-2026'
import { post as editors } from './ai-editors-are-agent-runtimes'
import { post as contextEngineering } from './context-engineering-for-coding-agents'
import { post as costPerTask } from './llm-cost-per-task-2026'
import { post as localLlm } from './local-llm-field-guide'
import { post as mcp } from './mcp-2026-07-28-explained'
import { post as onDevice } from './on-device-llms-react-native-tauri'

/**
 * Every published article. Each post lives in its own module beside this file; add one by
 * writing the module and listing it here. Order does not matter — lists sort by date.
 *
 * Read at build time too (routes, sitemap, link previews), so keep it free of browser APIs.
 */
export const posts: Post[] = [costPerTask, editors, designTools, contextEngineering, localLlm, mcp, onDevice]
