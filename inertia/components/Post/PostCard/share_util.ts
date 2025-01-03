// inertia/components/Post/PostCard/share_util.ts
export function copyLink(link: string) {
  navigator.clipboard
    .writeText(link)
    .then(() => {
      const alertBox = document.getElementById('copyAlert')
      if (alertBox) {
        alertBox.classList.remove('hidden')
        setTimeout(() => {
          alertBox.classList.add('hidden')
        }, 3000)
      }
    })
    .catch((err) => console.error('Failed to copy link: ', err))
}
