// Hardcoded user credentials for demonstration
// In production, these would come from a real auth system

export const USERS = {
  students: [
    { username: 'alex.student',  password: 'pass123', name: 'Alex Johnson',   avatar: 'AJ', color: 'from-blue-500 to-cyan-500' },
    { username: 'maya.student',  password: 'pass123', name: 'Maya Patel',     avatar: 'MP', color: 'from-violet-500 to-purple-500' },
    { username: 'chris.student', password: 'pass123', name: 'Chris Wilson',   avatar: 'CW', color: 'from-emerald-500 to-teal-500' },
  ],
  counselors: [
    { username: 'dr.sarah',   password: 'counsel123', name: 'Dr. Sarah Mitchell', avatar: 'SM', color: 'from-pink-500 to-rose-500',   specialty: 'Academic & Career' },
    { username: 'dr.james',   password: 'counsel123', name: 'Dr. James Thompson', avatar: 'JT', color: 'from-amber-500 to-orange-500', specialty: 'Mental Wellness' },
    { username: 'dr.priya',   password: 'counsel123', name: 'Dr. Priya Sharma',   avatar: 'PS', color: 'from-sky-500 to-blue-500',     specialty: 'Stress Management' },
    { username: 'dr.carlos',  password: 'counsel123', name: 'Dr. Carlos Rivera',  avatar: 'CR', color: 'from-lime-500 to-green-500',   specialty: 'Personal Development' },
  ],
}

export function findUser(username, password) {
  const allUsers = [
    ...USERS.students.map(u => ({ ...u, role: 'student' })),
    ...USERS.counselors.map(u => ({ ...u, role: 'counselor' })),
  ]
  return allUsers.find(u => u.username === username && u.password === password) || null
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('cc_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function storeUser(user) {
  localStorage.setItem('cc_user', JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem('cc_user')
  localStorage.removeItem('cc_slot_id')
}
