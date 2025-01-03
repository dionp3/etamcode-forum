import markdownit from 'markdown-it'
import hljs from 'highlight.js'

export const renderMarkdown = (content: string) => {
  const md = markdownit({
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value
        } catch (_) {}
      }
      return ''
    },
  })

  // Custom inline spoiler rule
  md.inline.ruler.before('emphasis', 'spoiler', (state, silent) => {
    const start = state.pos
    const marker = state.src.slice(start, start + 2)

    if (marker !== '>!' || silent) return false
    const end = state.src.indexOf('!<', start + 2)
    if (end === -1) return false

    const content = state.src.slice(start + 2, end)
    if (!content) return false

    if (!silent) {
      const tokenOpen = state.push('spoiler_open', 'span', 1)
      tokenOpen.attrs = [['class', 'spoiler']]

      const tokenText = state.push('text', '', 0)
      tokenText.content = content

      state.push('spoiler_close', 'span', -1)
    }

    state.pos = end + 2
    return true
  })

  // Modify the blockquote rule to ignore lines starting with `>!`
  const originalBlockquoteRule = md.block.ruler.getRules('')[0] // Retrieve blockquote rule
  md.block.ruler.at('blockquote', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const marker = state.src.slice(start, start + 2)

    if (marker === '>!' || !originalBlockquoteRule) return false

    return originalBlockquoteRule(state, startLine, endLine, silent)
  })

  // Custom renderers for spoiler
  md.renderer.rules = {
    ...md.renderer.rules,
    spoiler_open: () => `<span class="spoiler" onclick="this.classList.toggle('active')">`,
    text: (tokens, idx) => tokens[idx].content,
    spoiler_close: () => '</span>',
  }

  return md.render(content)
}
