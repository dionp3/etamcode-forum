import { Filter } from 'bad-words'

const filter = new Filter({ placeHolder: '·' })

const badWords = [
  'anjink',
  'kontol',
  'memek',
  'ajg',
  'bangsat',
  'babik',
  'k0nt0l',
  'm3m3k',
  'b4b1k',
  'b4ngs4t',
  '4nj1nk',
  '4jg',
  'andjing',
  'asoe',
  'bajingan',
  'coli',
  'cukimai',
  'fuck',
  'goblok',
  'janco',
  'jancuk',
  'kontol',
  'lonte',
  'mengancuk',
  'mengentot',
  'Negro',
  'ngewe',
  'pepek',
  'pukas',
  'shit',
  'tempik',
  'tobrut',
  'toket',
  'puki',
  'pukimai',
  'nigga',
  'nigger',
]

filter.addWords(...badWords)

export default filter
