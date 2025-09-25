export const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) {
    return Math.floor(interval) + ' năm'
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + ' tháng'
  }
  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + ' ngày'
  }
  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + ' giờ'
  }
  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + ' phút'
  }
  if (seconds < 10) {
    return 'vừa xong'
  }
  return Math.floor(seconds) + ' giây'
}

export const mapToObject = map => Object.fromEntries(map.entries());
