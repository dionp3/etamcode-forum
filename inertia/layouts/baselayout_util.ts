import axios from 'axios'

export const fetchForums = async () => {
  const response = await axios.get('/api/f')
  return response.data.forums
}
